type Filho = Node | string | false | null | undefined;
type Atributos = Record<string, string | number | boolean | EventListener | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  atributos: Atributos = {},
  ...filhos: Filho[]
): HTMLElementTagNameMap[K] {
  const elemento = document.createElement(tag);
  Object.entries(atributos).forEach(([nome, valor]) => {
    if (valor === undefined || valor === false) return;
    if (typeof valor === 'function') {
      elemento.addEventListener(nome.replace(/^on/, '').toLowerCase(), valor);
    } else if (valor === true) {
      elemento.setAttribute(nome, '');
    } else {
      elemento.setAttribute(nome, String(valor));
    }
  });
  anexar(elemento, filhos);
  return elemento;
}

export function anexar(pai: Element, filhos: Filho[]): void {
  filhos.forEach((filho) => {
    if (filho === false || filho === null || filho === undefined) return;
    pai.append(filho);
  });
}

export function substituir(pai: Element, ...filhos: Filho[]): void {
  pai.replaceChildren();
  anexar(pai, filhos);
}

const NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  atributos: Record<string, string | number> = {},
  ...filhos: Array<SVGElement | string>
): SVGElementTagNameMap[K] {
  const elemento = document.createElementNS(NS, tag);
  Object.entries(atributos).forEach(([nome, valor]) => elemento.setAttribute(nome, String(valor)));
  filhos.forEach((filho) => elemento.append(filho));
  return elemento;
}

export const movimentoReduzido = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const esperar = (ms: number): Promise<void> =>
  new Promise((resolver) => setTimeout(resolver, movimentoReduzido() ? 0 : ms));

let sequencia = 0;
export const novoId = (prefixo: string): string => `${prefixo}-${++sequencia}`;

export function campo(rotulo: string, controle: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, ajuda?: string): HTMLElement {
  const id = controle.id || novoId('campo');
  controle.id = id;
  return h(
    'div',
    { class: 'campo' },
    h('label', { for: id }, rotulo),
    controle,
    ajuda ? h('p', { class: 'campo__ajuda' }, ajuda) : null,
  );
}

export function entrada(valor: string, atributos: Atributos = {}): HTMLInputElement {
  const input = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', ...atributos });
  input.value = valor;
  return input;
}

export function botao(texto: string, aoClicar: () => void, variante: 'primario' | 'secundario' = 'primario'): HTMLButtonElement {
  return h('button', { type: 'button', class: `botao botao--${variante}`, onclick: () => aoClicar() }, texto);
}

export interface Opcao<T extends string> {
  readonly valor: T;
  readonly rotulo: string;
}

export function segmentado<T extends string>(
  nome: string,
  opcoes: readonly Opcao<T>[],
  inicial: T,
  aoMudar: (valor: T) => void,
): HTMLElement {
  const grupo = h('div', { class: 'segmentado', role: 'radiogroup', 'aria-label': nome });
  const botoes = opcoes.map((opcao) =>
    h(
      'button',
      {
        type: 'button',
        role: 'radio',
        class: 'segmentado__opcao',
        'aria-checked': String(opcao.valor === inicial),
        'data-valor': opcao.valor,
        onclick: () => selecionar(opcao.valor),
      },
      opcao.rotulo,
    ),
  );
  const selecionar = (valor: T) => {
    botoes.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.valor === valor)));
    aoMudar(valor);
  };
  grupo.addEventListener('keydown', (evento) => {
    const atual = botoes.findIndex((b) => b.getAttribute('aria-checked') === 'true');
    const passo = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (!passo) return;
    evento.preventDefault();
    const proximo = botoes[(atual + passo + botoes.length) % botoes.length];
    proximo.focus();
    selecionar(proximo.dataset.valor as T);
  });
  anexar(grupo, botoes);
  return grupo;
}

export function aguardarBotao(botaoAlvo: HTMLButtonElement, tarefa: () => Promise<void>): Promise<void> {
  botaoAlvo.disabled = true;
  botaoAlvo.setAttribute('aria-busy', 'true');
  return tarefa().finally(() => {
    botaoAlvo.disabled = false;
    botaoAlvo.removeAttribute('aria-busy');
  });
}
