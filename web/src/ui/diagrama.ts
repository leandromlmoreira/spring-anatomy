import { movimentoReduzido, novoId, svg } from './dom';

export type TipoNo = 'classe' | 'interface' | 'externo' | 'abstrata' | 'enum';
export type TipoAresta = 'chama' | 'implementa' | 'estende';

export interface No {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly rotulo?: string;
  readonly tipo?: TipoNo;
  readonly apelidos?: readonly string[];
  readonly largura?: number;
}

export interface Aresta {
  readonly de: string;
  readonly para: string;
  readonly tipo?: TipoAresta;
}

export interface Chamada {
  readonly padrao: string;
  readonly rotulo: string;
  readonly alvo: string;
  readonly x: number;
  readonly y: number;
}

export interface Diagrama {
  readonly largura: number;
  readonly altura: number;
  readonly nos: readonly No[];
  readonly arestas: readonly Aresta[];
  readonly chamadas?: readonly Chamada[];
}

export interface DiagramaVivo {
  readonly elemento: SVGSVGElement;
  pulsar(classe: string): void;
  repousar(): void;
}

interface Caixa {
  readonly no: No;
  readonly cx: number;
  readonly cy: number;
  readonly meiaLargura: number;
  readonly meiaAltura: number;
  readonly grupo: SVGGElement;
}

const ALTURA = 40;
const ALTURA_ESTEREOTIPO = 52;

const ESTEREOTIPO: Partial<Record<TipoNo, string>> = {
  interface: '«interface»',
  externo: '«externo»',
  abstrata: '«abstract»',
  enum: '«enum»',
};

export function larguraDoNo(no: No): number {
  return no.largura ?? Math.round((no.rotulo ?? no.id).length * 7.2 + 30);
}

function borda(caixa: Caixa, dx: number, dy: number): [number, number] {
  const escala = Math.min(
    dx === 0 ? Infinity : caixa.meiaLargura / Math.abs(dx),
    dy === 0 ? Infinity : caixa.meiaAltura / Math.abs(dy),
  );
  return [caixa.cx + dx * escala, caixa.cy + dy * escala];
}

export function segmento(de: Caixa, para: Caixa): [number, number, number, number] {
  const dx = para.cx - de.cx;
  const dy = para.cy - de.cy;
  const [x1, y1] = borda(de, dx, dy);
  const [x2, y2] = borda(para, -dx, -dy);
  return [x1, y1, x2, y2];
}

function criarCaixa(no: No, indice: number): Caixa {
  const largura = larguraDoNo(no);
  const estereotipo = no.tipo ? ESTEREOTIPO[no.tipo] : undefined;
  const altura = estereotipo ? ALTURA_ESTEREOTIPO : ALTURA;
  const grupo = svg('g', {
    class: `no no--${no.tipo ?? 'classe'}`,
    transform: `translate(${no.x - largura / 2} ${no.y - altura / 2})`,
    style: `--atraso:${indice * 55}ms`,
  });
  grupo.append(svg('rect', { class: 'no__caixa', width: largura, height: altura, rx: 9 }));
  if (estereotipo) {
    grupo.append(svg('text', { class: 'no__estereotipo', x: largura / 2, y: 18, 'text-anchor': 'middle' }, estereotipo));
  }
  grupo.append(
    svg('text', { class: 'no__rotulo', x: largura / 2, y: estereotipo ? 36 : 25, 'text-anchor': 'middle' }, no.rotulo ?? no.id),
  );
  return { no, cx: no.x, cy: no.y, meiaLargura: largura / 2, meiaAltura: altura / 2, grupo };
}

function marcadores(id: string): SVGDefsElement {
  return svg(
    'defs',
    {},
    svg('marker', { id: `${id}-seta`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
      svg('path', { d: 'M1 1 L9 5 L1 9', class: 'marcador marcador--seta' })),
    svg('marker', { id: `${id}-triangulo`, viewBox: '0 0 12 12', refX: 11, refY: 6, markerWidth: 10, markerHeight: 10, orient: 'auto-start-reverse' },
      svg('path', { d: 'M1 1 L11 6 L1 11 Z', class: 'marcador marcador--triangulo' })),
  );
}

const suavizar = (t: number): number => 1 - Math.pow(1 - t, 3);

export function criarDiagrama(diagrama: Diagrama, rotulo: string): DiagramaVivo {
  const id = novoId('diagrama');
  const elemento = svg('svg', {
    class: 'diagrama',
    viewBox: `0 0 ${diagrama.largura} ${diagrama.altura}`,
    role: 'img',
    'aria-label': rotulo,
  });
  const caixas = diagrama.nos.map(criarCaixa);
  const porId = new Map(caixas.map((caixa) => [caixa.no.id, caixa]));
  const camadaArestas = svg('g', { class: 'arestas' });
  const camadaPacotes = svg('g', { class: 'pacotes' });
  const linhas = new Map<string, SVGLineElement>();

  diagrama.arestas.forEach((aresta) => {
    const de = porId.get(aresta.de);
    const para = porId.get(aresta.para);
    if (!de || !para) return;
    const [x1, y1, x2, y2] = segmento(de, para);
    const tipo = aresta.tipo ?? 'chama';
    const linha = svg('line', {
      class: `aresta aresta--${tipo}`,
      x1, y1, x2, y2,
      'marker-end': `url(#${id}-${tipo === 'chama' ? 'seta' : 'triangulo'})`,
    });
    linhas.set(`${aresta.de}>${aresta.para}`, linha);
    camadaArestas.append(linha);
  });

  const camadaChamadas = svg('g', { class: 'chamadas' });
  (diagrama.chamadas ?? []).forEach((chamada, indice) => {
    const alvo = porId.get(chamada.alvo);
    if (!alvo) return;
    const largura = chamada.rotulo.length * 7.6 + 26;
    const [ax, ay] = borda(alvo, chamada.x - alvo.cx, chamada.y - alvo.cy);
    const ancora = svg('a', { href: `#${chamada.padrao}`, class: 'chamada', style: `--atraso:${400 + indice * 70}ms`, 'aria-label': `Abrir ${chamada.rotulo}` });
    ancora.append(
      svg('line', { class: 'chamada__guia', x1: chamada.x, y1: chamada.y, x2: ax, y2: ay }),
      svg('circle', { class: 'chamada__ponto', cx: ax, cy: ay, r: 3 }),
      svg('rect', { class: 'chamada__pilula', x: chamada.x - largura / 2, y: chamada.y - 13, width: largura, height: 26, rx: 13 }),
      svg('text', { class: 'chamada__texto', x: chamada.x, y: chamada.y + 4.5, 'text-anchor': 'middle' }, chamada.rotulo),
    );
    camadaChamadas.append(ancora);
  });

  elemento.append(marcadores(id), camadaChamadas, camadaArestas, ...caixas.map((caixa) => caixa.grupo), camadaPacotes);

  let anterior: Caixa | undefined;
  const temporizadores = new Map<Caixa, number>();

  function localizar(classe: string): Caixa | undefined {
    return porId.get(classe) ?? caixas.find((caixa) => caixa.no.apelidos?.includes(classe));
  }

  function acender(caixa: Caixa): void {
    caixa.grupo.classList.remove('no--ativo');
    void caixa.grupo.getBoundingClientRect();
    caixa.grupo.classList.add('no--ativo');
    window.clearTimeout(temporizadores.get(caixa));
    temporizadores.set(caixa, window.setTimeout(() => caixa.grupo.classList.remove('no--ativo'), 1100));
  }

  function viajar(de: Caixa, para: Caixa): void {
    const linha = linhas.get(`${de.no.id}>${para.no.id}`) ?? linhas.get(`${para.no.id}>${de.no.id}`);
    if (!linha || movimentoReduzido()) return;
    linha.classList.add('aresta--ativa');
    window.setTimeout(() => linha.classList.remove('aresta--ativa'), 700);
    const [x1, y1, x2, y2] = segmento(de, para);
    const pacote = svg('circle', { class: 'pacote', r: 4.5, cx: x1, cy: y1 });
    camadaPacotes.append(pacote);
    const inicio = performance.now();
    const duracao = 420;
    const quadro = (agora: number) => {
      const t = suavizar(Math.min(1, (agora - inicio) / duracao));
      pacote.setAttribute('cx', String(x1 + (x2 - x1) * t));
      pacote.setAttribute('cy', String(y1 + (y2 - y1) * t));
      if (t < 1) requestAnimationFrame(quadro);
      else pacote.remove();
    };
    requestAnimationFrame(quadro);
  }

  return {
    elemento,
    pulsar(classe) {
      const caixa = localizar(classe);
      if (!caixa) return;
      if (anterior && anterior !== caixa) viajar(anterior, caixa);
      acender(caixa);
      anterior = caixa;
    },
    repousar() {
      anterior = undefined;
    },
  };
}
