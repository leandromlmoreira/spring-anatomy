import { ClienteBuilder } from '../engine/builder';
import { NotificacaoFactory } from '../engine/factory';
import { LIMITE_CARACTERES_SMS } from '../engine/adapter';
import { TIPOS_NOTIFICACAO, TipoNotificacao } from '../engine/modelo';
import { gravarRastro } from '../engine/rastro';
import { botao, campo, h, segmentado } from '../ui/dom';
import { acoes, criarSaida, demo, ficha, Ambiente } from './comum';

const GATEWAYS = new Set(['ServidorSmtp', 'OperadoraSms', 'ProvedorPush']);

export function demoAdapter({ sistema }: Ambiente): HTMLElement {
  let tipo: TipoNotificacao = 'SMS';
  const mensagem = h('textarea', { name: 'mensagem-adapter', rows: 3 });
  mensagem.value = 'Olá! Seu pedido 4821 saiu para entrega e deve chegar hoje entre 14h e 18h. Acompanhe pelo app ou responda esta mensagem se precisar remarcar a entrega para outro dia da semana.';
  const contador = h('span', { class: 'contador' });
  const saida = criarSaida('Escolha o canal e despache. Cada adapter traduz a mesma Notificacao para um gateway diferente.');

  const atualizarContador = () => {
    const tamanho = mensagem.value.length;
    const estoura = tipo === 'SMS' && tamanho > LIMITE_CARACTERES_SMS;
    contador.textContent = tipo === 'SMS' ? `${tamanho}/${LIMITE_CARACTERES_SMS}${estoura ? ', o adapter vai cortar' : ''}` : `${tamanho} caracteres`;
    contador.classList.toggle('contador--alerta', estoura);
  };
  mensagem.addEventListener('input', atualizarContador);
  atualizarContador();

  const canal = segmentado<TipoNotificacao>(
    'Canal da notificação',
    TIPOS_NOTIFICACAO.map((valor) => ({ valor, rotulo: valor })),
    tipo,
    (valor) => {
      tipo = valor;
      atualizarContador();
    },
  );

  const despachar = botao('despachante.enviar(notificacao)', () => {
    const cliente = sistema.clienteService.buscarTodos()[0] ?? ClienteBuilder.novoCliente().comNome('Caio Brandão').comCep('01001-000').build();
    const gravacao = gravarRastro();
    try {
      const notificacao = NotificacaoFactory.criar(tipo, mensagem.value, cliente);
      const enviada = sistema.despachante.enviar(notificacao);
      const chamada = gravacao.eventos.find((evento) => GATEWAYS.has(evento.classe));
      if (!enviada || !chamada) {
        saida.erro('Sem adapter', `Nenhum CanalNotificacao suporta ${tipo}. A notificação fica com enviada=false.`);
        return;
      }
      saida.mostrar(
        ficha('Entrada: Notificacao', [
          ['tipo', notificacao.tipo],
          ['mensagem', `${notificacao.mensagem.length} caracteres`],
          ['cliente', notificacao.cliente.nome],
        ]),
        ficha(`Saída: ${chamada.classe}.${chamada.metodo}`, [['chamada', chamada.mensagem]], 'traduzido'),
      );
    } catch (erro) {
      saida.erro('Erro', (erro as Error).message);
    } finally {
      gravacao.parar();
    }
  });

  return demo(
    'Despache pelo canal que quiser',
    h('div', { class: 'demo__bloco' }, h('span', { class: 'demo__rotulo' }, 'TipoNotificacao'), canal),
    h('div', { class: 'campo-com-contador' }, campo('Mensagem', mensagem), contador),
    acoes(despachar),
    saida.elemento,
  );
}
