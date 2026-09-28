import { Sistema } from '../engine/sistema';
import { demoAdapter } from '../demos/adapter';
import { demoBuilder } from '../demos/builder';
import { Ambiente } from '../demos/comum';
import { demoFacade } from '../demos/facade';
import { demoFactory } from '../demos/factory';
import { demoObserver } from '../demos/observer';
import { demoSingleton } from '../demos/singleton';
import { demoStrategy } from '../demos/strategy';
import { demoTemplate } from '../demos/template';
import { criarPainelCodigo } from './codigo';
import { criarDiagrama } from './diagrama';
import { h, movimentoReduzido, substituir } from './dom';
import { IdPadrao, Padrao, PADROES, padraoPorId } from './padroes';
import { criarRegistro, Registro } from './registro';

const DEMOS: Record<IdPadrao, (ambiente: Ambiente) => HTMLElement> = {
  facade: demoFacade,
  builder: demoBuilder,
  strategy: demoStrategy,
  observer: demoObserver,
  factory: demoFactory,
  adapter: demoAdapter,
  template: demoTemplate,
  singleton: demoSingleton,
};

const LEGENDA = h(
  'figcaption',
  { class: 'legenda' },
  h('span', { class: 'legenda__item legenda__item--chama' }, 'chama'),
  h('span', { class: 'legenda__item legenda__item--implementa' }, 'implementa ou estende'),
  h('span', { class: 'legenda__item legenda__item--ativo' }, 'executando agora'),
);

function estado(sistema: Sistema): HTMLElement {
  const lista = h('dl', { class: 'estado', 'aria-label': 'Estado do sistema no navegador' });
  const atualizar = () => {
    const notificacoes = sistema.notificacoes.findAll();
    const enviadas = notificacoes.filter((notificacao) => notificacao.enviada).length;
    const itens: Array<[string, string]> = [
      ['Clientes', String(sistema.clientes.findAll().length)],
      ['CEPs em cache', String(sistema.enderecos.count())],
      ['Notificações', `${notificacoes.length} (${enviadas} enviadas)`],
      ['Estratégia', sistema.estrategia === 'viacep' ? 'ViaCEP' : 'Offline'],
    ];
    substituir(lista, ...itens.map(([rotulo, valor]) => h('div', { class: 'estado__item' }, h('dt', {}, rotulo), h('dd', {}, valor))));
  };
  sistema.aoMudar(atualizar);
  atualizar();
  return lista;
}

function trilho(aoEscolher: (padrao: Padrao) => void): { elemento: HTMLElement; marcar: (id: IdPadrao) => void } {
  const itens = PADROES.map((padrao) =>
    h(
      'a',
      {
        href: `#${padrao.id}`,
        class: 'trilho__item',
        'data-padrao': padrao.id,
        onclick: (evento: Event) => {
          evento.preventDefault();
          aoEscolher(padrao);
        },
      },
      h('span', { class: 'trilho__nome' }, padrao.nome),
      h('span', { class: 'trilho__peca' }, padrao.peca),
    ),
  );
  return {
    elemento: h('nav', { class: 'trilho', 'aria-label': 'Padrões de projeto' }, ...itens),
    marcar(id) {
      itens.forEach((item) => {
        const ativo = item.dataset.padrao === id;
        if (ativo) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
        if (ativo && item.parentElement && item.parentElement.scrollWidth > item.parentElement.clientWidth) {
          item.parentElement.scrollTo({ left: item.offsetLeft - 16, behavior: movimentoReduzido() ? 'auto' : 'smooth' });
        }
      });
    },
  };
}

function vizinhos(padrao: Padrao, aoEscolher: (padrao: Padrao) => void): HTMLElement {
  const indice = PADROES.indexOf(padrao);
  const anterior = PADROES[(indice - 1 + PADROES.length) % PADROES.length];
  const proximo = PADROES[(indice + 1) % PADROES.length];
  const link = (alvo: Padrao, rotulo: string, classe: string) =>
    h(
      'a',
      {
        href: `#${alvo.id}`,
        class: `vizinho ${classe}`,
        onclick: (evento: Event) => {
          evento.preventDefault();
          aoEscolher(alvo);
        },
      },
      h('span', { class: 'vizinho__rotulo' }, rotulo),
      h('span', { class: 'vizinho__nome' }, alvo.nome),
    );
  return h('div', { class: 'vizinhos' }, link(anterior, 'Anterior', 'vizinho--anterior'), link(proximo, 'Próximo', 'vizinho--proximo'));
}

interface Montagem {
  readonly elemento: HTMLElement;
  desmontar(): void;
}

function montarPlaca(padrao: Padrao, sistema: Sistema, aoEscolher: (padrao: Padrao) => void): Montagem {
  const descartes: Array<() => void> = [];
  const ambiente: Ambiente = { sistema, aoMudar: (ouvinte) => descartes.push(sistema.aoMudar(ouvinte)) };
  const diagrama = criarDiagrama(padrao.diagrama, `Diagrama de classes do padrão ${padrao.nome}`);
  const codigo = criarPainelCodigo(padrao.arquivos, padrao.atalhosDeCodigo);
  const registro: Registro = criarRegistro(diagrama, codigo);
  const idTitulo = `titulo-${padrao.id}`;

  const elemento = h(
    'article',
    { class: 'placa', 'aria-labelledby': idTitulo, 'data-padrao': padrao.id },
    h(
      'header',
      { class: 'placa__cabeca' },
      h('h2', { id: idTitulo, class: 'placa__titulo', tabindex: -1 }, padrao.nome, h('span', { class: 'etiqueta etiqueta--categoria' }, padrao.categoria)),
      h('p', { class: 'placa__intencao' }, padrao.intencao),
    ),
    h(
      'div',
      { class: 'placa__topo' },
      h(
        'div',
        { class: 'placa__texto' },
        h('h3', {}, 'O problema'),
        h('p', {}, padrao.problema),
        h('h3', {}, 'Como este código resolve'),
        h('p', {}, padrao.solucao),
      ),
      h('figure', { class: 'painel painel--diagrama' }, diagrama.elemento, LEGENDA.cloneNode(true)),
    ),
    h(
      'div',
      { class: 'placa__bancada' },
      h('div', { class: 'painel painel--demo' }, DEMOS[padrao.id](ambiente), registro.elemento),
      codigo.elemento,
    ),
    vizinhos(padrao, aoEscolher),
  );

  return {
    elemento,
    desmontar() {
      registro.desligar();
      descartes.forEach((descartar) => descartar());
    },
  };
}

export function montarExplorador(raiz: HTMLElement, sistema: Sistema): void {
  const palco = h('div', { class: 'palco' });
  let atual: Montagem | undefined;
  let padraoAtual: Padrao | undefined;

  const mostrar = (padrao: Padrao, origem: 'inicio' | 'clique' | 'hash') => {
    if (padraoAtual === padrao) return;
    padraoAtual = padrao;
    atual?.desmontar();
    atual = montarPlaca(padrao, sistema, (proximo) => mostrar(proximo, 'clique'));
    substituir(palco, atual.elemento);
    rail.marcar(padrao.id);
    if (origem !== 'inicio') {
      history.replaceState(null, '', `#${padrao.id}`);
      const topo = raiz.getBoundingClientRect().top + window.scrollY - 16;
      if (origem === 'hash' || Math.abs(window.scrollY - topo) > window.innerHeight * 0.6) {
        window.scrollTo({ top: topo, behavior: movimentoReduzido() ? 'auto' : 'smooth' });
      }
      atual.elemento.querySelector<HTMLElement>('.placa__titulo')?.focus({ preventScroll: true });
    }
  };

  const rail = trilho((padrao) => mostrar(padrao, 'clique'));

  substituir(
    raiz,
    h(
      'div',
      { class: 'explorador__cabeca' },
      h('h2', { class: 'secao__titulo', id: 'titulo-explorador' }, 'Oito padrões, um único sistema'),
      h('p', { class: 'secao__texto' }, 'As demos compartilham o mesmo estado: o cliente que você cadastra na Facade aparece no Observer, na Factory e no Template Method.'),
      estado(sistema),
    ),
    h('div', { class: 'explorador__corpo' }, rail.elemento, palco),
  );

  const doHash = () => padraoPorId(location.hash.slice(1));
  window.addEventListener('hashchange', () => {
    const padrao = doHash();
    if (padrao) mostrar(padrao, 'hash');
  });
  const inicial = doHash();
  mostrar(inicial ?? PADROES[0], 'inicio');
  if (inicial) requestAnimationFrame(() => raiz.scrollIntoView({ behavior: 'auto' }));
}
