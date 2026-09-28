import { ClienteBuilder } from '../engine/builder';
import { Cliente } from '../engine/modelo';
import { aguardarBotao, botao, campo, entrada, h, substituir } from '../ui/dom';
import { acoes, criarSaida, demo, linha, mascararCep, Ambiente } from './comum';
import { tituloDoErro } from './facade';

const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function coluna(titulo: string, subtitulo: string, itens: HTMLElement[], vazio: string): HTMLElement {
  return h(
    'section',
    { class: 'coluna-observer' },
    h('h4', {}, titulo, h('span', {}, subtitulo)),
    itens.length ? h('ul', { class: 'lista-eventos' }, ...itens) : h('p', { class: 'saida__dica' }, vazio),
  );
}

export function demoObserver({ sistema, aoMudar }: Ambiente): HTMLElement {
  const nome = entrada('Lívia Prado', { name: 'nome-observer' });
  const cep = mascararCep(entrada('01001-000', { name: 'cep-observer' }));
  const clientes = h('ul', { class: 'lista-clientes' });
  const paineis = h('div', { class: 'observers' });
  const saida = criarSaida('');

  const renderizar = () => {
    const todos = sistema.clienteService.buscarTodos();
    substituir(
      clientes,
      ...(todos.length
        ? todos.map((cliente) => itemCliente(cliente))
        : [h('li', { class: 'saida__dica' }, 'Nenhum cliente ainda. Cadastre um para disparar CRIADO.')]),
    );
    const notificacoes = sistema.notificacoes.findAll().slice(-5).reverse();
    const trilha = sistema.auditoria.trilha().slice(0, 5);
    substituir(
      paineis,
      coluna(
        'NotificacaoObserver',
        'avisos gerados',
        notificacoes.map((notificacao) =>
          h('li', {}, h('span', { class: 'etiqueta' }, notificacao.tipo), h('span', {}, notificacao.mensagem), h('span', { class: notificacao.enviada ? 'ok' : 'pendente' }, notificacao.enviada ? 'enviada' : 'pendente')),
        ),
        'Sem avisos ainda.',
      ),
      coluna(
        'AuditoriaObserver',
        'trilha',
        trilha.map((registro) =>
          h('li', {}, h('span', { class: 'etiqueta' }, registro.evento), h('span', {}, `#${registro.clienteId} ${registro.cliente}`), h('span', { class: 'hora' }, HORA.format(registro.instante))),
        ),
        'Trilha vazia.',
      ),
    );
  };

  const executar = async (tarefa: () => Promise<unknown> | unknown) => {
    try {
      await tarefa();
      saida.dica('');
    } catch (erro) {
      saida.erro(tituloDoErro(erro), (erro as Error).message);
    } finally {
      sistema.avisar();
    }
  };

  function itemCliente(cliente: Cliente): HTMLElement {
    const id = cliente.id ?? 0;
    const atualizar = botao('Atualizar', () =>
      executar(() =>
        sistema.clienteService.atualizar(
          id,
          ClienteBuilder.novoCliente().comNome(`${cliente.nome?.replace(/ \(editado\)$/, '')} (editado)`).comCep(cliente.endereco?.cep).build(),
        ),
      ), 'secundario');
    const remover = botao('Remover', () => executar(() => sistema.clienteService.remover(id)), 'secundario');
    return h('li', {}, h('span', { class: 'lista-clientes__nome' }, `#${id} ${cliente.nome}`), h('span', { class: 'lista-clientes__acoes' }, atualizar, remover));
  }

  const cadastrar = botao('Cadastrar', () =>
    aguardarBotao(cadastrar, () =>
      executar(() => sistema.controller.inserir({ nome: nome.value, cep: cep.value })),
    ),
  );

  aoMudar(renderizar);
  renderizar();

  return demo(
    'Dispare eventos e veja quem reage',
    linha(campo('Nome', nome), campo('CEP', cep)),
    acoes(cadastrar),
    saida.elemento,
    h('div', { class: 'demo__bloco' }, h('span', { class: 'demo__rotulo' }, 'Clientes no sistema'), clientes),
    paineis,
  );
}
