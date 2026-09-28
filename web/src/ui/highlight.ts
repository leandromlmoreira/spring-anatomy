export type TipoToken = 'palavra' | 'texto' | 'anotacao' | 'tipo' | 'numero' | 'comentario' | 'metodo' | 'simples';

export interface Token {
  readonly tipo: TipoToken;
  readonly valor: string;
}

const PALAVRAS = new Set(
  'abstract boolean break case catch class default do double else enum extends final finally for if implements import instanceof int interface long new null package private protected public record return static super switch this throw throws true false try var void while'.split(
    ' ',
  ),
);

const REGRAS: ReadonlyArray<[TipoToken, RegExp]> = [
  ['comentario', /^\/\/.*/],
  ['comentario', /^\/\*[\s\S]*?\*\//],
  ['texto', /^"""[\s\S]*?"""/],
  ['texto', /^"(?:\\.|[^"\\])*"/],
  ['texto', /^'(?:\\.|[^'\\])'/],
  ['anotacao', /^@[A-Za-z_]\w*/],
  ['numero', /^\b\d[\d_]*(?:\.\d+)?[LlFfDd]?\b/],
  ['simples', /^\s+/],
];

function classificarIdentificador(palavra: string, resto: string): TipoToken {
  if (PALAVRAS.has(palavra)) return 'palavra';
  if (/^[A-Z]/.test(palavra)) return 'tipo';
  if (/^\s*\(/.test(resto)) return 'metodo';
  return 'simples';
}

export function tokenizar(linha: string): Token[] {
  const tokens: Token[] = [];
  let resto = linha;
  while (resto.length > 0) {
    const regra = REGRAS.find(([, padrao]) => padrao.test(resto));
    if (regra) {
      const valor = resto.match(regra[1])?.[0] ?? '';
      tokens.push({ tipo: regra[0], valor });
      resto = resto.slice(valor.length);
      continue;
    }
    const identificador = resto.match(/^[A-Za-z_$][\w$]*/)?.[0];
    if (identificador) {
      const depois = resto.slice(identificador.length);
      tokens.push({ tipo: classificarIdentificador(identificador, depois), valor: identificador });
      resto = depois;
      continue;
    }
    tokens.push({ tipo: 'simples', valor: resto[0] });
    resto = resto.slice(1);
  }
  return juntarSimples(tokens);
}

function juntarSimples(tokens: Token[]): Token[] {
  return tokens.reduce<Token[]>((juntos, token) => {
    const anterior = juntos[juntos.length - 1];
    if (anterior && anterior.tipo === 'simples' && token.tipo === 'simples') {
      juntos[juntos.length - 1] = { tipo: 'simples', valor: anterior.valor + token.valor };
    } else {
      juntos.push(token);
    }
    return juntos;
  }, []);
}

export interface Intervalo {
  readonly inicio: number;
  readonly fim: number;
}

const DECLARACAO = /^\s*(?:@\w+\s+)*(?:(?:public|protected|private|static|final|abstract|default|synchronized)\s+)*(?:<[^>]+>\s+)?[\w<>[\],.? ]+\s+(\w+)\s*\(/;

function ehDeclaracao(linha: string, metodo: string): boolean {
  const correspondencia = linha.match(DECLARACAO);
  if (!correspondencia || correspondencia[1] !== metodo) return false;
  return !/^\s*(return|throw|new)\b/.test(linha) && !linha.includes('=');
}

export function localizarMetodo(linhas: readonly string[], metodo: string): Intervalo | undefined {
  const inicio = linhas.findIndex((linha) => ehDeclaracao(linha, metodo));
  if (inicio < 0) return undefined;
  let profundidade = 0;
  let abriu = false;
  for (let indice = inicio; indice < linhas.length; indice++) {
    for (const caractere of linhas[indice]) {
      if (caractere === '{') {
        profundidade++;
        abriu = true;
      } else if (caractere === '}') {
        profundidade--;
      }
    }
    if (!abriu && linhas[indice].trimEnd().endsWith(';')) return { inicio, fim: indice };
    if (abriu && profundidade === 0) return { inicio, fim: indice };
  }
  return { inicio, fim: inicio };
}

export function localizarTrecho(linhas: readonly string[], trecho: string): Intervalo | undefined {
  const indice = linhas.findIndex((linha) => linha.includes(trecho));
  return indice < 0 ? undefined : { inicio: indice, fim: indice };
}
