import { Evento, ouvirRastro } from '../engine/rastro';
import { PainelCodigo } from './codigo';
import { DiagramaVivo } from './diagrama';
import { esperar, h, movimentoReduzido } from './dom';

export interface Registro {
  readonly elemento: HTMLElement;
  desligar(): void;
  ocioso(): Promise<void>;
}

const RITMO_MS = 240;

function vazio(): HTMLElement {
  return h(
    'li',
    { class: 'registro__vazio' },
    h('strong', {}, 'Nada executado ainda.'),
    h('span', {}, 'Rode a demo e cada chamada aparece aqui, na ordem em que o código executa.'),
  );
}

function linhaDoEvento(evento: Evento, passo: number): HTMLElement {
  return h(
    'li',
    { class: `registro__item registro__item--${evento.nivel}`, style: `--i:${passo}` },
    h('span', { class: 'registro__passo', 'aria-hidden': 'true' }, String(passo).padStart(2, '0')),
    h('span', { class: 'registro__chamada' }, h('span', { class: 'registro__classe' }, evento.classe), h('span', { class: 'registro__metodo' }, `.${evento.metodo}()`)),
    h('span', { class: 'registro__mensagem' }, evento.mensagem),
  );
}

export function criarRegistro(diagrama: DiagramaVivo, codigo: PainelCodigo): Registro {
  const lista = h('ol', { class: 'registro__lista', 'aria-live': 'polite', 'aria-relevant': 'additions' }, vazio());
  const contador = h('span', { class: 'registro__contador' }, '0 chamadas');
  const fila: Evento[] = [];
  let passo = 0;
  let tocando: Promise<void> = Promise.resolve();
  let ativo = true;

  const limpar = () => {
    fila.length = 0;
    passo = 0;
    lista.replaceChildren(vazio());
    contador.textContent = '0 chamadas';
    codigo.limpar();
    diagrama.repousar();
  };

  async function tocar(): Promise<void> {
    while (fila.length > 0 && ativo) {
      const evento = fila.shift() as Evento;
      if (passo === 0) lista.replaceChildren();
      passo += 1;
      const item = linhaDoEvento(evento, passo);
      lista.append(item);
      lista.scrollTo({ top: lista.scrollHeight, behavior: movimentoReduzido() ? 'auto' : 'smooth' });
      contador.textContent = `${passo} ${passo === 1 ? 'chamada' : 'chamadas'}`;
      diagrama.pulsar(evento.classe);
      codigo.destacar(evento.classe, evento.metodo);
      await esperar(RITMO_MS);
    }
  }

  const desligarRastro = ouvirRastro((evento) => {
    fila.push(evento);
    if (fila.length === 1) tocando = tocando.then(tocar);
  });

  const elemento = h(
    'div',
    { class: 'registro' },
    h(
      'div',
      { class: 'registro__topo' },
      h('span', { class: 'registro__titulo' }, 'Rastro de execução'),
      contador,
      h('button', { type: 'button', class: 'registro__limpar', onclick: limpar }, 'Limpar'),
    ),
    lista,
  );

  return {
    elemento,
    desligar() {
      ativo = false;
      desligarRastro();
    },
    ocioso: () => tocando,
  };
}
