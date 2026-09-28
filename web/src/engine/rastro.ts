export type Nivel = 'info' | 'ok' | 'aviso' | 'erro';

export interface Evento {
  readonly classe: string;
  readonly metodo: string;
  readonly mensagem: string;
  readonly nivel: Nivel;
}

type Ouvinte = (evento: Evento) => void;

const ouvintes = new Set<Ouvinte>();

export function ouvirRastro(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

function registrar(evento: Evento): void {
  ouvintes.forEach((ouvinte) => ouvinte(evento));
}

export interface Log {
  info(metodo: string, mensagem: string): void;
  ok(metodo: string, mensagem: string): void;
  aviso(metodo: string, mensagem: string): void;
  erro(metodo: string, mensagem: string): void;
}

export function criarLog(classe: string): Log {
  const emitir = (nivel: Nivel) => (metodo: string, mensagem: string) =>
    registrar({ classe, metodo, mensagem, nivel });
  return { info: emitir('info'), ok: emitir('ok'), aviso: emitir('aviso'), erro: emitir('erro') };
}

export function gravarRastro(): { eventos: Evento[]; parar: () => void } {
  const eventos: Evento[] = [];
  const parar = ouvirRastro((evento) => eventos.push(evento));
  return { eventos, parar };
}
