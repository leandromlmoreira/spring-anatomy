import { DespachanteNotificacao } from './adapter';
import { NotificacaoFactory } from './factory';
import { Cliente, Notificacao } from './modelo';
import { criarLog } from './rastro';
import { NotificacaoRepository } from './repositorios';

export interface ClienteObserver {
  readonly nome: string;
  onClienteCriado(cliente: Cliente): void;
  onClienteAtualizado(cliente: Cliente): void;
  onClienteRemovido(cliente: Cliente): void;
}

export type EventoCliente = 'CRIADO' | 'ATUALIZADO' | 'REMOVIDO';

const ENTREGA: Record<EventoCliente, (observer: ClienteObserver, cliente: Cliente) => void> = {
  CRIADO: (observer, cliente) => observer.onClienteCriado(cliente),
  ATUALIZADO: (observer, cliente) => observer.onClienteAtualizado(cliente),
  REMOVIDO: (observer, cliente) => observer.onClienteRemovido(cliente),
};

export class PublicadorEventosCliente {
  private readonly log = criarLog('PublicadorEventosCliente');

  constructor(private readonly observers: readonly ClienteObserver[]) {}

  publicar(evento: EventoCliente, cliente: Cliente): void {
    this.log.info('publicar', `${evento} para ${this.observers.length} observers.`);
    this.observers.forEach((observer) => this.entregar(evento, observer, cliente));
  }

  private entregar(evento: EventoCliente, observer: ClienteObserver, cliente: Cliente): void {
    try {
      ENTREGA[evento](observer, cliente);
    } catch (falha) {
      this.log.aviso('entregar', `${observer.nome} falhou ao receber ${evento}: ${(falha as Error).message}`);
    }
  }
}

export class NotificacaoObserver implements ClienteObserver {
  readonly nome = 'NotificacaoObserver';
  private readonly log = criarLog(this.nome);

  constructor(
    private readonly notificacaoRepository: NotificacaoRepository,
    private readonly despachante: DespachanteNotificacao,
  ) {}

  onClienteCriado(cliente: Cliente): void {
    this.log.info('onClienteCriado', `Boas-vindas para ${cliente.nome}.`);
    this.despacharERegistrar(NotificacaoFactory.boasVindas(cliente));
  }

  onClienteAtualizado(cliente: Cliente): void {
    this.log.info('onClienteAtualizado', `Aviso de atualização para ${cliente.nome}.`);
    this.despacharERegistrar(NotificacaoFactory.atualizacao(cliente));
  }

  onClienteRemovido(cliente: Cliente): void {
    this.log.info('onClienteRemovido', `Aviso de remoção para ${cliente.nome}.`);
    this.despacharERegistrar(NotificacaoFactory.remocao(cliente));
  }

  private despacharERegistrar(notificacao: Notificacao): void {
    this.despachante.enviar(notificacao);
    this.notificacaoRepository.save(notificacao);
  }
}

export interface RegistroAuditoria {
  readonly evento: EventoCliente;
  readonly clienteId?: number;
  readonly cliente?: string;
  readonly instante: Date;
}

export const CAPACIDADE_AUDITORIA = 50;

export class AuditoriaObserver implements ClienteObserver {
  readonly nome = 'AuditoriaObserver';
  private readonly log = criarLog(this.nome);
  private readonly registros: RegistroAuditoria[] = [];

  onClienteCriado(cliente: Cliente): void {
    this.registrar('CRIADO', cliente, 'onClienteCriado');
  }

  onClienteAtualizado(cliente: Cliente): void {
    this.registrar('ATUALIZADO', cliente, 'onClienteAtualizado');
  }

  onClienteRemovido(cliente: Cliente): void {
    this.registrar('REMOVIDO', cliente, 'onClienteRemovido');
  }

  trilha(): RegistroAuditoria[] {
    return [...this.registros];
  }

  private registrar(evento: EventoCliente, cliente: Cliente, metodo: string): void {
    this.registros.unshift({ evento, clienteId: cliente.id, cliente: cliente.nome, instante: new Date() });
    this.registros.splice(CAPACIDADE_AUDITORIA);
    this.log.ok(metodo, `${evento} de ${cliente.nome} anotado na trilha.`);
  }
}
