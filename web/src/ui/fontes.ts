const arquivos = import.meta.glob('../../../src/**/java/**/*.java', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const REPOSITORIO = 'https://github.com/leandromlmoreira/spring-anatomy';

export interface Fonte {
  readonly nome: string;
  readonly caminho: string;
  readonly linhas: readonly string[];
  readonly url: string;
}

const PREFIXO = '../../../';

const fontes: Fonte[] = Object.entries(arquivos).map(([chave, conteudo]) => {
  const caminho = chave.slice(PREFIXO.length);
  return {
    nome: caminho.split('/').pop()?.replace('.java', '') ?? caminho,
    caminho,
    linhas: conteudo.replace(/\r\n/g, '\n').trimEnd().split('\n'),
    url: `${REPOSITORIO}/blob/main/${caminho}`,
  };
});

export function fonte(nome: string): Fonte {
  const encontrada = fontes.find((candidata) => candidata.nome === nome);
  if (!encontrada) {
    throw new Error(`Arquivo ${nome}.java não encontrado no repositório.`);
  }
  return encontrada;
}

export function existeFonte(nome: string): boolean {
  return fontes.some((candidata) => candidata.nome === nome);
}

export function totalDeClasses(): number {
  return fontes.filter((candidata) => candidata.caminho.startsWith('src/main')).length;
}

export function totalDeTestes(): number {
  return fontes.filter((candidata) => candidata.caminho.startsWith('src/test')).length;
}
