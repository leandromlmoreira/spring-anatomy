import { h, novoId, substituir } from './dom';
import { existeFonte, fonte, Fonte } from './fontes';
import { Intervalo, localizarMetodo, tokenizar } from './highlight';

export interface PainelCodigo {
  readonly elemento: HTMLElement;
  destacar(classe: string, metodo: string): void;
  limpar(): void;
}

function renderizarLinha(texto: string, numero: number): HTMLElement {
  const conteudo = tokenizar(texto).map((token) =>
    token.tipo === 'simples' ? token.valor : h('span', { class: `tk-${token.tipo}` }, token.valor),
  );
  return h(
    'div',
    { class: 'codigo__linha', 'data-linha': numero },
    h('span', { class: 'codigo__numero', 'aria-hidden': 'true' }, String(numero)),
    h('span', { class: 'codigo__texto' }, ...(conteudo.length ? conteudo : [' '])),
  );
}

export type Atalhos = Readonly<Record<string, readonly [string, string]>>;

export function criarPainelCodigo(nomes: readonly string[], atalhos: Atalhos = {}): PainelCodigo {
  const disponiveis = nomes.filter(existeFonte).map(fonte);
  const idPainel = novoId('codigo');
  const corpo = h('div', { class: 'codigo__corpo', role: 'tabpanel', id: idPainel, tabindex: 0 });
  const caminho = h('a', { class: 'codigo__caminho', target: '_blank', rel: 'noopener' });
  const abas = disponiveis.map((arquivo, indice) =>
    h(
      'button',
      {
        type: 'button',
        role: 'tab',
        class: 'codigo__aba',
        'aria-controls': idPainel,
        'aria-selected': String(indice === 0),
        tabindex: indice === 0 ? 0 : -1,
        onclick: () => abrir(arquivo),
      },
      `${arquivo.nome}.java`,
    ),
  );
  const listaAbas = h('div', { class: 'codigo__abas', role: 'tablist', 'aria-label': 'Arquivos do repositório' }, ...abas);
  let atual: Fonte | undefined;
  let linhas: HTMLElement[] = [];

  listaAbas.addEventListener('keydown', (evento) => {
    const passo = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (!passo || !atual) return;
    const indice = disponiveis.indexOf(atual);
    const proximo = disponiveis[(indice + passo + disponiveis.length) % disponiveis.length];
    abrir(proximo);
    abas[disponiveis.indexOf(proximo)].focus();
  });

  function abrir(arquivo: Fonte): void {
    if (atual === arquivo) return;
    atual = arquivo;
    abas.forEach((aba, indice) => {
      const ativa = disponiveis[indice] === arquivo;
      aba.setAttribute('aria-selected', String(ativa));
      aba.tabIndex = ativa ? 0 : -1;
    });
    caminho.textContent = arquivo.caminho.replace('src/main/java/dev/leandromacedo/patterns/', '').replace('src/test/java/dev/leandromacedo/patterns/', 'test/');
    caminho.href = arquivo.url;
    linhas = arquivo.linhas.map((texto, indice) => renderizarLinha(texto, indice + 1));
    substituir(corpo, h('div', { class: 'codigo__trilho' }, ...linhas));
    const declaracao = arquivo.linhas.findIndex((texto) => /^(@|public |final |abstract |class |interface |enum |record )/.test(texto));
    const alinhar = () => {
      corpo.scrollTop = declaracao > 2 ? linhas[declaracao - 1].offsetTop - 12 : 0;
    };
    alinhar();
    requestAnimationFrame(alinhar);
  }

  function marcar(intervalo: Intervalo): void {
    linhas.forEach((linha, indice) => {
      linha.classList.toggle('marcada', indice >= intervalo.inicio && indice <= intervalo.fim);
    });
    const primeira = linhas[intervalo.inicio];
    const alvo = primeira.offsetTop - corpo.clientHeight * 0.28;
    corpo.scrollTo({ top: Math.max(0, alvo), behavior: 'smooth' });
  }

  if (disponiveis[0]) abrir(disponiveis[0]);

  const elemento = h(
    'div',
    { class: 'painel painel--codigo' },
    h('div', { class: 'codigo__topo' }, listaAbas),
    corpo,
    h('div', { class: 'codigo__rodape' }, h('span', {}, 'Código real do repositório'), caminho),
  );

  return {
    elemento,
    destacar(classeOriginal, metodoOriginal) {
      const [classe, metodo] = atalhos[classeOriginal] ?? [classeOriginal, metodoOriginal];
      const arquivo = disponiveis.find((candidato) => candidato.nome === classe);
      if (!arquivo) return;
      abrir(arquivo);
      const intervalo = localizarMetodo(arquivo.linhas, metodo);
      if (intervalo) marcar(intervalo);
    },
    limpar() {
      linhas.forEach((linha) => linha.classList.remove('marcada'));
    },
  };
}
