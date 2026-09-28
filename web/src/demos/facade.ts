import { CepInvalidoError } from '../engine/modelo';
import { CepNaoEncontradoError } from '../engine/servico';
import { ViaCepIndisponivelError } from '../engine/strategy';
import { ValidacaoError } from '../engine/controller';
import { aguardarBotao, botao, campo, entrada, h } from '../ui/dom';
import { acoes, atalhosDeCep, criarSaida, demo, ficha, fichaEndereco, linha, mascararCep, Ambiente } from './comum';

export function tituloDoErro(erro: unknown): string {
  if (erro instanceof ValidacaoError || erro instanceof CepInvalidoError) return '400 Bad Request';
  if (erro instanceof CepNaoEncontradoError) return '422 Unprocessable Entity';
  if (erro instanceof ViaCepIndisponivelError) return '503 Service Unavailable';
  return 'Erro';
}

export function demoFacade({ sistema, aoMudar }: Ambiente): HTMLElement {
  const nome = entrada('Marina Duarte', { name: 'nome' });
  const cep = mascararCep(entrada('01001-000', { name: 'cep' }));
  const complemento = entrada('', { name: 'complemento', placeholder: 'Opcional' });
  const saida = criarSaida('Envie o formulário: a fachada recebe só nome e CEP e resolve o resto.');
  const estrategia = h('p', { class: 'demo__nota' });
  const atualizarNota = () => {
    estrategia.textContent =
      sistema.estrategia === 'viacep'
        ? 'Endereço resolvido ao vivo pelo ViaCEP. Sem rede? Troque a estratégia na peça Strategy.'
        : 'Estratégia offline ativa: o endereço fica só com o CEP e o que você digitar.';
  };
  atualizarNota();
  aoMudar(atualizarNota);

  const enviar = botao('POST /clientes', () =>
    aguardarBotao(enviar, async () => {
      saida.carregando(sistema.estrategia === 'viacep' ? 'Consultando o ViaCEP...' : 'Gravando...');
      try {
        const cliente = await sistema.controller.inserir({ nome: nome.value, cep: cep.value, complemento: complemento.value });
        saida.mostrar(
          ficha(`Cliente #${cliente.id}`, [['nome', cliente.nome]], '201 Created'),
          fichaEndereco(cliente.endereco),
        );
      } catch (erro) {
        saida.erro(tituloDoErro(erro), (erro as Error).message);
      } finally {
        sistema.avisar();
      }
    }),
  );

  return demo(
    'Cadastre um cliente pela fachada',
    linha(campo('Nome', nome), campo('CEP', cep)),
    atalhosDeCep(cep),
    campo('Complemento', complemento),
    acoes(enviar),
    estrategia,
    saida.elemento,
  );
}
