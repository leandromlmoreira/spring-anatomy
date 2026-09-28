export class CepInvalidoError extends Error {
  constructor(valor: string | undefined) {
    super(`CEP inválido: ${valor ?? ''}. Use 8 dígitos, como 01001-000.`);
  }
}

export function normalizarCep(valor: string | undefined): string {
  const digitos = (valor ?? '').replace(/\D/g, '');
  if (digitos.length !== 8) {
    throw new CepInvalidoError(valor);
  }
  return digitos;
}

export function formatarCep(cep: string): string {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

function preferir(informado: string | undefined, atual: string | undefined): string | undefined {
  return informado === undefined || informado.trim() === '' ? atual : informado.trim();
}

export class Endereco {
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  ddd?: string;

  constructor(public cep?: string) {}

  mesclar(informado: Endereco): void {
    this.logradouro = preferir(informado.logradouro, this.logradouro);
    this.complemento = preferir(informado.complemento, this.complemento);
    this.bairro = preferir(informado.bairro, this.bairro);
    this.localidade = preferir(informado.localidade, this.localidade);
    this.uf = preferir(informado.uf, this.uf);
  }
}

export class Cliente {
  id?: number;
  nome?: string;
  endereco?: Endereco;
  criadoEm?: Date;
}

export const TIPOS_NOTIFICACAO = ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'] as const;
export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

export function tipoNotificacaoDe(valor: string | undefined): TipoNotificacao {
  const normalizado = (valor ?? '').trim().toUpperCase();
  const tipo = TIPOS_NOTIFICACAO.find((candidato) => candidato === normalizado);
  if (!tipo) {
    throw new Error(`Tipo de notificação não suportado: ${valor ?? ''}`);
  }
  return tipo;
}

export class Notificacao {
  id?: number;
  enviada = false;
  readonly criadaEm = new Date();

  constructor(
    readonly tipo: TipoNotificacao,
    readonly mensagem: string,
    readonly cliente: Cliente,
  ) {}

  marcarComoEnviada(): void {
    this.enviada = true;
  }
}
