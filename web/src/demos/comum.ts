import type { Sistema } from '../engine/sistema';
import { Endereco, formatarCep } from '../engine/modelo';
import { h, substituir } from '../ui/dom';

export interface Saida {
  readonly elemento: HTMLElement;
  dica(texto: string): void;
  carregando(texto: string): void;
  erro(titulo: string, detalhe: string): void;
  mostrar(...conteudo: Node[]): void;
}

export function criarSaida(dicaInicial: string): Saida {
  const elemento = h('div', { class: 'saida', 'aria-live': 'polite' });
  const saida: Saida = {
    elemento,
    dica(texto) {
      elemento.dataset.estado = 'vazio';
      substituir(elemento, h('p', { class: 'saida__dica' }, texto));
    },
    carregando(texto) {
      elemento.dataset.estado = 'carregando';
      substituir(
        elemento,
        h('div', { class: 'esqueleto', 'aria-hidden': 'true' }, h('span', {}), h('span', {}), h('span', {})),
        h('p', { class: 'saida__dica' }, texto),
      );
    },
    erro(titulo, detalhe) {
      elemento.dataset.estado = 'erro';
      substituir(elemento, h('div', { class: 'saida__erro', role: 'alert' }, h('strong', {}, titulo), h('span', {}, detalhe)));
    },
    mostrar(...conteudo) {
      elemento.dataset.estado = 'ok';
      substituir(elemento, ...conteudo);
    },
  };
  saida.dica(dicaInicial);
  return saida;
}

export function ficha(titulo: string, linhas: ReadonlyArray<readonly [string, string | undefined]>, destaque?: string): HTMLElement {
  return h(
    'div',
    { class: 'ficha' },
    h('div', { class: 'ficha__topo' }, h('span', { class: 'ficha__titulo' }, titulo), destaque ? h('span', { class: 'etiqueta' }, destaque) : null),
    h(
      'dl',
      { class: 'ficha__lista' },
      ...linhas.flatMap(([chave, valor]) => [
        h('dt', {}, chave),
        h('dd', { class: valor ? '' : 'vazio' }, valor && valor !== '' ? valor : 'null'),
      ]),
    ),
  );
}

export function fichaEndereco(endereco: Endereco | undefined, titulo = 'Endereco'): HTMLElement {
  return ficha(titulo, [
    ['cep', endereco?.cep ? formatarCep(endereco.cep) : undefined],
    ['logradouro', endereco?.logradouro],
    ['complemento', endereco?.complemento],
    ['bairro', endereco?.bairro],
    ['localidade', endereco?.localidade],
    ['uf', endereco?.uf],
  ]);
}

export function mascararCep(input: HTMLInputElement): HTMLInputElement {
  input.inputMode = 'numeric';
  input.maxLength = 9;
  input.addEventListener('input', () => {
    const digitos = input.value.replace(/\D/g, '').slice(0, 8);
    input.value = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
  });
  return input;
}

export function demo(titulo: string, ...conteudo: Array<Node | null>): HTMLElement {
  return h('div', { class: 'demo' }, h('h3', { class: 'demo__titulo' }, titulo), ...conteudo.filter((item): item is Node => item !== null));
}

export function acoes(...botoes: HTMLElement[]): HTMLElement {
  return h('div', { class: 'demo__acoes' }, ...botoes);
}

export function linha(...campos: HTMLElement[]): HTMLElement {
  return h('div', { class: 'demo__linha' }, ...campos);
}

export const CEPS_DE_EXEMPLO: ReadonlyArray<readonly [string, string]> = [
  ['01001-000', 'Praça da Sé, SP'],
  ['20040-020', 'Praça Pio X, RJ'],
  ['30130-010', 'Praça Sete, BH'],
  ['99999-999', 'CEP que não existe'],
];

export function atalhosDeCep(input: HTMLInputElement): HTMLElement {
  return h(
    'div',
    { class: 'atalhos', role: 'group', 'aria-label': 'CEPs de exemplo' },
    ...CEPS_DE_EXEMPLO.map(([cep, rotulo]) =>
      h(
        'button',
        {
          type: 'button',
          class: 'atalho',
          onclick: () => {
            input.value = cep;
            input.focus();
          },
        },
        h('span', { class: 'atalho__cep' }, cep),
        h('span', { class: 'atalho__rotulo' }, rotulo),
      ),
    ),
  );
}


export interface Ambiente {
  readonly sistema: Sistema;
  aoMudar(ouvinte: () => void): void;
}
