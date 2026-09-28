import { Notificacao, TipoNotificacao } from './modelo';
import { criarLog } from './rastro';

let sequenciaProtocolo = 0x3a41c0;

export class ServidorSmtp {
  private readonly log = criarLog('ServidorSmtp');

  transmitir(destinatario: string, assunto: string, corpoHtml: string): string {
    sequenciaProtocolo += 0x1f3;
    const protocolo = `smtp-${sequenciaProtocolo.toString(16)}`;
    this.log.ok('transmitir', `("${destinatario}", "${assunto}", "${corpoHtml}") -> ${protocolo}`);
    return protocolo;
  }
}

export const LIMITE_CARACTERES_SMS = 160;

export class OperadoraSms {
  private readonly log = criarLog('OperadoraSms');

  dispararTexto(destino: string, texto: string): void {
    if (texto.length > LIMITE_CARACTERES_SMS) {
      this.log.erro('dispararTexto', `SMS acima de ${LIMITE_CARACTERES_SMS} caracteres.`);
      throw new Error(`SMS acima de ${LIMITE_CARACTERES_SMS} caracteres.`);
    }
    this.log.ok('dispararTexto', `("${destino}", "${texto}") com ${texto.length} caracteres`);
  }
}

const CAMPOS_PUSH = ['destino', 'titulo', 'corpo'];

export class ProvedorPush {
  private readonly log = criarLog('ProvedorPush');

  publicar(payload: Record<string, string>): void {
    if (!CAMPOS_PUSH.every((campo) => campo in payload)) {
      this.log.erro('publicar', `Payload de push incompleto: ${Object.keys(payload).join(', ')}`);
      throw new Error('Payload de push incompleto.');
    }
    this.log.ok('publicar', JSON.stringify(payload));
  }
}

export interface CanalNotificacao {
  readonly nome: string;
  suporta(tipo: TipoNotificacao): boolean;
  enviar(notificacao: Notificacao): void;
}

export const ASSUNTO_EMAIL = 'Aviso do Spring Anatomy';

export class EmailNotificacaoAdapter implements CanalNotificacao {
  readonly nome = 'EmailNotificacaoAdapter';
  private readonly log = criarLog(this.nome);

  constructor(private readonly servidorSmtp: ServidorSmtp) {}

  suporta(tipo: TipoNotificacao): boolean {
    return tipo === 'EMAIL';
  }

  enviar(notificacao: Notificacao): void {
    const corpoHtml = `<p>${notificacao.mensagem}</p>`;
    this.log.info('enviar', 'Traduz a Notificacao para transmitir(destinatario, assunto, corpoHtml).');
    this.servidorSmtp.transmitir(notificacao.cliente.nome ?? '', ASSUNTO_EMAIL, corpoHtml);
  }
}

const RETICENCIAS = '...';

export function caberNoSms(texto: string): string {
  if (texto.length <= LIMITE_CARACTERES_SMS) {
    return texto;
  }
  return texto.slice(0, LIMITE_CARACTERES_SMS - RETICENCIAS.length) + RETICENCIAS;
}

export class SmsNotificacaoAdapter implements CanalNotificacao {
  readonly nome = 'SmsNotificacaoAdapter';
  private readonly log = criarLog(this.nome);

  constructor(private readonly operadoraSms: OperadoraSms) {}

  suporta(tipo: TipoNotificacao): boolean {
    return tipo === 'SMS';
  }

  enviar(notificacao: Notificacao): void {
    const texto = caberNoSms(notificacao.mensagem);
    const cortou = texto !== notificacao.mensagem;
    this.log.info('enviar', cortou
      ? `Mensagem com ${notificacao.mensagem.length} caracteres cortada para ${LIMITE_CARACTERES_SMS}.`
      : 'Traduz a Notificacao para dispararTexto(destino, texto).');
    this.operadoraSms.dispararTexto(notificacao.cliente.nome ?? '', texto);
  }
}

export const TITULO_PUSH = 'Spring Anatomy';

export class PushNotificacaoAdapter implements CanalNotificacao {
  readonly nome = 'PushNotificacaoAdapter';
  private readonly log = criarLog(this.nome);

  constructor(private readonly provedorPush: ProvedorPush) {}

  suporta(tipo: TipoNotificacao): boolean {
    return tipo === 'PUSH';
  }

  enviar(notificacao: Notificacao): void {
    this.log.info('enviar', 'Traduz a Notificacao para publicar(Map payload).');
    this.provedorPush.publicar({
      destino: notificacao.cliente.nome ?? '',
      titulo: TITULO_PUSH,
      corpo: notificacao.mensagem,
    });
  }
}

export class DespachanteNotificacao {
  private readonly log = criarLog('DespachanteNotificacao');

  constructor(private readonly canais: readonly CanalNotificacao[]) {}

  enviar(notificacao: Notificacao): boolean {
    this.log.info('enviar', `Procurando canal para ${notificacao.tipo} entre ${this.canais.length} adapters.`);
    const canal = this.canais.find((candidato) => candidato.suporta(notificacao.tipo));
    if (!canal) {
      this.log.aviso('enviar', `Nenhum canal registrado para ${notificacao.tipo}`);
      return false;
    }
    canal.enviar(notificacao);
    notificacao.marcarComoEnviada();
    this.log.ok('enviar', `Entregue por ${canal.nome}.`);
    return true;
  }
}
