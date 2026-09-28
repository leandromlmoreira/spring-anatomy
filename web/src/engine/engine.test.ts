import { afterEach, describe, expect, it, vi } from 'vitest';
import { caberNoSms, DespachanteNotificacao, EmailNotificacaoAdapter, OperadoraSms, ProvedorPush, PushNotificacaoAdapter, ServidorSmtp, SmsNotificacaoAdapter } from './adapter';
import { ClienteBuilder } from './builder';
import { ContainerSpring } from './container';
import { validar } from './controller';
import { NotificacaoFactory } from './factory';
import { Cliente, Endereco, normalizarCep } from './modelo';
import { AuditoriaObserver, CAPACIDADE_AUDITORIA, ClienteObserver, PublicadorEventosCliente } from './observer';
import { gravarRastro } from './rastro';
import { CepNaoEncontradoError } from './servico';
import { Sistema } from './sistema';
import { ConsultaEnderecoOffline, ViaCepConsultaEndereco, ViaCepIndisponivelError } from './strategy';
import { CatalogoProcessamentos, ProcessamentoClientePadrao, ProcessamentoClientePremium, sobrescreve } from './template';
import { NotificacaoRepository } from './repositorios';

const PRACA_DA_SE = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
  ddd: '11',
};

function respostaJson(corpo: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(corpo), { status })) as unknown as typeof fetch;
}

function cliente(nome: string): Cliente {
  return ClienteBuilder.novoCliente().comNome(nome).comCep('01001-000').build();
}

const gravacoes: Array<() => void> = [];
afterEach(() => gravacoes.splice(0).forEach((parar) => parar()));

function gravar() {
  const gravacao = gravarRastro();
  gravacoes.push(gravacao.parar);
  return gravacao.eventos;
}

describe('Builder', () => {
  it('monta cliente com endereço passo a passo', () => {
    const montado = ClienteBuilder.novoCliente().comNome('Tomás Aguiar').comCep('20040-020').comBairro('Centro').comUf('RJ').build();
    expect(montado.nome).toBe('Tomás Aguiar');
    expect(montado.endereco).toMatchObject({ cep: '20040-020', bairro: 'Centro', uf: 'RJ' });
  });

  it('não constrói cliente sem nome', () => {
    expect(() => ClienteBuilder.novoCliente().comCep('01001-000').build()).toThrow('precisa de nome');
  });
});

describe('Factory', () => {
  it('cria cada evento no canal certo', () => {
    const marina = cliente('Marina Duarte');
    expect(NotificacaoFactory.boasVindas(marina).tipo).toBe('EMAIL');
    expect(NotificacaoFactory.atualizacao(marina).tipo).toBe('SMS');
    expect(NotificacaoFactory.remocao(marina).tipo).toBe('PUSH');
    expect(NotificacaoFactory.premium(marina).mensagem).toContain('premium');
  });

  it('aceita tipo em texto e recusa desconhecido', () => {
    expect(NotificacaoFactory.criar(' whatsapp ', 'Oi', cliente('Rui')).tipo).toBe('WHATSAPP');
    expect(() => NotificacaoFactory.criar('fax', 'Oi', cliente('Rui'))).toThrow('Tipo de notificação não suportado: fax');
    expect(() => NotificacaoFactory.criar('sms', '  ', cliente('Rui'))).toThrow('mensagem');
  });
});

describe('Adapter', () => {
  const smtp = new ServidorSmtp();
  const operadora = new OperadoraSms();
  const push = new ProvedorPush();
  const despachante = new DespachanteNotificacao([
    new EmailNotificacaoAdapter(smtp),
    new SmsNotificacaoAdapter(operadora),
    new PushNotificacaoAdapter(push),
  ]);

  it('traduz cada tipo para a interface do gateway', () => {
    const transmitir = vi.spyOn(smtp, 'transmitir');
    const disparar = vi.spyOn(operadora, 'dispararTexto');
    const publicar = vi.spyOn(push, 'publicar');
    const caio = cliente('Caio Brandão');

    despachante.enviar(NotificacaoFactory.criar('EMAIL', 'Seu boleto venceu', caio));
    despachante.enviar(NotificacaoFactory.criar('SMS', 'Código 4821', caio));
    despachante.enviar(NotificacaoFactory.criar('PUSH', 'Pedido enviado', caio));

    expect(transmitir).toHaveBeenCalledWith('Caio Brandão', 'Aviso do Spring Anatomy', '<p>Seu boleto venceu</p>');
    expect(disparar).toHaveBeenCalledWith('Caio Brandão', 'Código 4821');
    expect(publicar).toHaveBeenCalledWith({ destino: 'Caio Brandão', titulo: 'Spring Anatomy', corpo: 'Pedido enviado' });
  });

  it('não marca como enviada quando nenhum canal suporta o tipo', () => {
    const notificacao = NotificacaoFactory.criar('WHATSAPP', 'Oi', cliente('Caio'));
    expect(despachante.enviar(notificacao)).toBe(false);
    expect(notificacao.enviada).toBe(false);
  });

  it('corta mensagens longas para caber no SMS', () => {
    const ajustada = caberNoSms('a'.repeat(200));
    expect(ajustada).toHaveLength(160);
    expect(ajustada.endsWith('...')).toBe(true);
    expect(caberNoSms('curta')).toBe('curta');
  });
});

describe('Observer', () => {
  it('entrega o evento a todos e isola falhas', () => {
    const quebrado: ClienteObserver = {
      nome: 'Quebrado',
      onClienteCriado: () => {
        throw new Error('fora do ar');
      },
      onClienteAtualizado: () => undefined,
      onClienteRemovido: () => undefined,
    };
    const auditoria = new AuditoriaObserver();
    const eventos = gravar();

    new PublicadorEventosCliente([quebrado, auditoria]).publicar('CRIADO', cliente('Lívia Prado'));

    expect(auditoria.trilha().map((registro) => registro.evento)).toEqual(['CRIADO']);
    expect(eventos.some((evento) => evento.nivel === 'aviso' && evento.mensagem.includes('Quebrado falhou'))).toBe(true);
  });

  it('auditoria guarda os mais recentes primeiro e com limite', () => {
    const auditoria = new AuditoriaObserver();
    const lia = cliente('Lia');
    for (let i = 0; i < CAPACIDADE_AUDITORIA + 5; i++) auditoria.onClienteAtualizado(lia);
    auditoria.onClienteRemovido(lia);
    expect(auditoria.trilha()).toHaveLength(CAPACIDADE_AUDITORIA);
    expect(auditoria.trilha()[0].evento).toBe('REMOVIDO');
  });
});

describe('Strategy', () => {
  it('ViaCEP converte a resposta em endereço', async () => {
    const buscar = respostaJson(PRACA_DA_SE);
    const endereco = await new ViaCepConsultaEndereco(buscar).consultar('01001000');
    expect(buscar).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/');
    expect(endereco).toMatchObject({ cep: '01001000', logradouro: 'Praça da Sé', localidade: 'São Paulo' });
  });

  it('ViaCEP devolve vazio para erro e falha para rede', async () => {
    expect(await new ViaCepConsultaEndereco(respostaJson({ erro: 'true' })).consultar('99999999')).toBeUndefined();
    const semRede = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    await expect(new ViaCepConsultaEndereco(semRede).consultar('01001000')).rejects.toBeInstanceOf(ViaCepIndisponivelError);
  });

  it('offline devolve só o CEP', async () => {
    expect(await new ConsultaEnderecoOffline().consultar('01001000')).toEqual(new Endereco('01001000'));
  });
});

describe('Template Method', () => {
  const notificacoes = new NotificacaoRepository();
  const premium = new ProcessamentoClientePremium(new DespachanteNotificacao([new EmailNotificacaoAdapter(new ServidorSmtp())]), notificacoes);
  const padrao = new ProcessamentoClientePadrao();

  it('premium segue o esqueleto e sobrescreve os ganchos', () => {
    const relatorio = premium.processar(cliente('Helena Vasconcelos'));
    expect(relatorio.etapas.map((etapa) => etapa.metodo)).toEqual(['validar', 'aplicarBeneficios', 'notificar', 'registrarLog']);
    expect(relatorio.etapas[2].descricao).toBe('Aviso premium enviado por EMAIL.');
    expect(notificacoes.findAll()).toHaveLength(1);
  });

  it('padrão herda os ganchos e interrompe cliente inválido', () => {
    expect(padrao.processar(cliente('Otávio Reis')).etapas[2].descricao).toBe('Plano sem aviso extra.');
    const semNome = new Cliente();
    const relatorio = premium.processar(semNome);
    expect(relatorio.concluido).toBe(false);
    expect(relatorio.etapas).toHaveLength(1);
  });

  it('sabe quais ganchos cada subclasse sobrescreve', () => {
    expect(sobrescreve(premium, 'notificar')).toBe(true);
    expect(sobrescreve(padrao, 'notificar')).toBe(false);
    expect(sobrescreve(padrao, 'aplicarBeneficios')).toBe(true);
  });

  it('catálogo escolhe pelo plano', () => {
    const catalogo = new CatalogoProcessamentos([premium, padrao]);
    expect(catalogo.processar(cliente('Rui'), 'PADRAO').plano).toBe('padrao');
    expect(() => catalogo.processar(cliente('Rui'), 'ouro')).toThrow('Plano desconhecido');
  });
});

describe('Singleton', () => {
  it('singleton reaproveita e prototype cria outra instância', () => {
    const container = new ContainerSpring();
    container.registrar('ClienteServiceImpl');
    expect(container.getBean('ClienteServiceImpl')).toBe(container.getBean('ClienteServiceImpl'));
    expect(container.instanciasCriadas).toBe(1);
    container.mudarEscopo('ClienteServiceImpl', 'prototype');
    expect(container.getBean('ClienteServiceImpl')).not.toBe(container.getBean('ClienteServiceImpl'));
    expect(container.instanciasCriadas).toBe(2);
    expect(() => container.getBean('Fantasma')).toThrow('No qualifying bean');
  });
});

describe('Facade de ponta a ponta', () => {
  it('cadastro consulta ViaCEP uma vez, usa cache e dispara os observers', async () => {
    const buscar = respostaJson(PRACA_DA_SE);
    const sistema = new Sistema({ buscar });
    const eventos = gravar();

    const marina = await sistema.controller.inserir({ nome: 'Marina Duarte', cep: '01001-000', complemento: 'Loja 3' });
    await sistema.controller.inserir({ nome: 'Iara Nogueira', cep: '01001000' });

    expect(buscar).toHaveBeenCalledTimes(1);
    expect(marina.endereco).toMatchObject({ logradouro: 'Praça da Sé', complemento: 'Loja 3' });
    expect(sistema.notificacoes.findAll().map((notificacao) => [notificacao.tipo, notificacao.enviada])).toEqual([
      ['EMAIL', true],
      ['EMAIL', true],
    ]);
    expect(sistema.auditoria.trilha()).toHaveLength(2);
    const classes = new Set(eventos.map((evento) => evento.classe));
    ['ClienteRestController', 'ClienteBuilder', 'ClienteServiceImpl', 'ViaCepConsultaEndereco', 'NotificacaoObserver', 'EmailNotificacaoAdapter', 'ServidorSmtp', 'AuditoriaObserver'].forEach((classe) =>
      expect(classes).toContain(classe),
    );
  });

  it('valida entrada e sinaliza CEP inexistente', async () => {
    const sistema = new Sistema({ buscar: respostaJson({ erro: true }) });
    await expect(sistema.controller.inserir({ nome: 'Ana', cep: '123' })).rejects.toThrow('O CEP precisa ter 8 dígitos.');
    await expect(sistema.controller.inserir({ nome: 'Ana', cep: '99999-999' })).rejects.toBeInstanceOf(CepNaoEncontradoError);
    expect(sistema.clientes.findAll()).toHaveLength(0);
    expect(() => validar({ nome: ' ', cep: '01001-000' })).toThrow('Informe o nome do cliente.');
  });

  it('trocar a estratégia não perde os dados já gravados', async () => {
    const sistema = new Sistema({ buscar: respostaJson(PRACA_DA_SE) });
    await sistema.controller.inserir({ nome: 'Beatriz', cep: '01001-000' });
    sistema.usarEstrategia('offline');
    const offline = await sistema.controller.inserir({ nome: 'Caio', cep: '20040-020', cidade: 'Rio de Janeiro' });
    expect(sistema.clienteService.consultaEndereco.nome).toBe('ConsultaEnderecoOffline');
    expect(offline.endereco).toMatchObject({ cep: '20040020', localidade: 'Rio de Janeiro', logradouro: undefined });
    expect(sistema.clientes.findAll()).toHaveLength(2);
  });

  it('atualizar e remover geram SMS e push', async () => {
    const sistema = new Sistema({ estrategia: 'offline' });
    const salvo = await sistema.controller.inserir({ nome: 'Rui', cep: '01001-000' });
    await sistema.clienteService.atualizar(salvo.id ?? 0, ClienteBuilder.novoCliente().comNome('Rui Prado').comCep('01001-000').build());
    expect(sistema.notificacoes.findAll().map((notificacao) => notificacao.tipo)).toEqual(['EMAIL', 'SMS']);
    sistema.clienteService.remover(salvo.id ?? 0);
    expect(sistema.notificacoes.findAll()).toHaveLength(0);
    expect(sistema.auditoria.trilha()[0].evento).toBe('REMOVIDO');
  });
});

describe('CEP', () => {
  it('normaliza e recusa formato errado', () => {
    expect(normalizarCep(' 01001-000 ')).toBe('01001000');
    expect(() => normalizarCep('0100-100')).toThrow('CEP inválido');
  });
});
