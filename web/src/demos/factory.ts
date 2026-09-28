import { ClienteBuilder } from '../engine/builder';
import { NotificacaoFactory } from '../engine/factory';
import { Cliente, Notificacao, TIPOS_NOTIFICACAO } from '../engine/modelo';
import { botao, campo, entrada, h } from '../ui/dom';
import { acoes, criarSaida, demo, ficha, linha, Ambiente } from './comum';

const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

type Atalho = 'boasVindas' | 'atualizacao' | 'remocao' | 'premium';

const ATALHOS: ReadonlyArray<readonly [Atalho, string]> = [
  ['boasVindas', 'boasVindas()'],
  ['atualizacao', 'atualizacao()'],
  ['remocao', 'remocao()'],
  ['premium', 'premium()'],
];

export function demoFactory({ sistema }: Ambiente): HTMLElement {
  const tipo = entrada('sms', { name: 'tipo', list: 'tipos-notificacao' });
  const lista = h('datalist', { id: 'tipos-notificacao' }, ...TIPOS_NOTIFICACAO.map((valor) => h('option', { value: valor })));
  const mensagem = entrada('Seu pedido saiu para entrega.', { name: 'mensagem' });
  const saida = criarSaida('Digite um tipo livre, como "sms", "Push" ou "fax", e veja a fábrica validar.');

  const destinatario = (): Cliente =>
    sistema.clienteService.buscarTodos()[0] ?? ClienteBuilder.novoCliente().comNome('Iara Nogueira').comCep('01001-000').build();

  const mostrar = (notificacao: Notificacao) =>
    saida.mostrar(
      ficha('Notificacao', [
        ['tipo', notificacao.tipo],
        ['mensagem', notificacao.mensagem],
        ['cliente', notificacao.cliente.nome],
        ['enviada', String(notificacao.enviada)],
        ['criadaEm', HORA.format(notificacao.criadaEm)],
      ], 'nova instância'),
    );

  const executar = (criar: () => Notificacao) => {
    try {
      mostrar(criar());
    } catch (erro) {
      saida.erro('IllegalArgumentException', (erro as Error).message);
    }
  };

  const criar = botao('criar(tipo, mensagem, cliente)', () => executar(() => NotificacaoFactory.criar(tipo.value, mensagem.value, destinatario())));
  const atalhos = ATALHOS.map(([metodo, rotulo]) => botao(rotulo, () => executar(() => NotificacaoFactory[metodo](destinatario())), 'secundario'));

  return demo(
    'Peça uma notificação à fábrica',
    linha(campo('Tipo', tipo, 'Texto livre, como chega pela API.'), campo('Mensagem', mensagem)),
    lista,
    acoes(criar),
    h('div', { class: 'demo__bloco' }, h('span', { class: 'demo__rotulo' }, 'Receitas prontas da fábrica'), acoes(...atalhos)),
    saida.elemento,
  );
}
