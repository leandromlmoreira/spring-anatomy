import { DespachanteNotificacao } from './adapter';
import { NotificacaoFactory } from './factory';
import { Cliente } from './modelo';
import { criarLog } from './rastro';
import { NotificacaoRepository } from './repositorios';

export interface Etapa {
  readonly metodo: string;
  readonly descricao: string;
  readonly classe: string;
}

export class RelatorioProcessamento {
  readonly etapas: Etapa[] = [];
  concluido = true;

  constructor(readonly plano: string) {}

  registrar(metodo: string, descricao: string, classe: string): void {
    this.etapas.push({ metodo, descricao, classe });
    criarLog(classe).info(metodo, descricao);
  }

  interromper(motivo: string, classe: string): RelatorioProcessamento {
    this.etapas.push({ metodo: 'validar', descricao: motivo, classe });
    criarLog(classe).erro('validar', motivo);
    this.concluido = false;
    return this;
  }
}

const TEMPLATE = 'ProcessamentoClienteTemplate';

export abstract class ProcessamentoClienteTemplate {
  processar(cliente: Cliente): RelatorioProcessamento {
    const relatorio = new RelatorioProcessamento(this.plano());
    criarLog(TEMPLATE).info('processar', `Esqueleto fixo, plano ${this.plano()}.`);
    if (!this.validar(cliente)) {
      return relatorio.interromper('Cliente sem nome: processamento interrompido.', TEMPLATE);
    }
    relatorio.registrar('validar', `Cliente ${cliente.nome} validado.`, TEMPLATE);
    this.aplicarBeneficios(cliente, relatorio);
    this.notificar(cliente, relatorio);
    this.registrarLog(cliente, relatorio);
    return relatorio;
  }

  abstract plano(): string;

  abstract readonly nome: string;

  protected abstract aplicarBeneficios(cliente: Cliente, relatorio: RelatorioProcessamento): void;

  protected validar(cliente: Cliente | undefined): boolean {
    return Boolean(cliente?.nome && cliente.nome.trim() !== '');
  }

  protected notificar(_cliente: Cliente, relatorio: RelatorioProcessamento): void {
    relatorio.registrar('notificar', 'Plano sem aviso extra.', TEMPLATE);
  }

  protected registrarLog(cliente: Cliente, relatorio: RelatorioProcessamento): void {
    relatorio.registrar('registrarLog', `Log resumido de ${cliente.nome}.`, TEMPLATE);
  }
}

export class ProcessamentoClientePadrao extends ProcessamentoClienteTemplate {
  readonly nome = 'ProcessamentoClientePadrao';

  plano(): string {
    return 'padrao';
  }

  protected aplicarBeneficios(_cliente: Cliente, relatorio: RelatorioProcessamento): void {
    relatorio.registrar('aplicarBeneficios', 'Plano padrão: nenhum benefício adicional.', this.nome);
  }
}

export class ProcessamentoClientePremium extends ProcessamentoClienteTemplate {
  readonly nome = 'ProcessamentoClientePremium';

  constructor(
    private readonly despachante: DespachanteNotificacao,
    private readonly notificacaoRepository: NotificacaoRepository,
  ) {
    super();
  }

  plano(): string {
    return 'premium';
  }

  protected aplicarBeneficios(_cliente: Cliente, relatorio: RelatorioProcessamento): void {
    relatorio.registrar('aplicarBeneficios', 'Atendimento prioritário e frete grátis liberados.', this.nome);
  }

  protected notificar(cliente: Cliente, relatorio: RelatorioProcessamento): void {
    const notificacao = NotificacaoFactory.premium(cliente);
    const enviada = this.despachante.enviar(notificacao);
    this.notificacaoRepository.save(notificacao);
    relatorio.registrar(
      'notificar',
      enviada ? `Aviso premium enviado por ${notificacao.tipo}.` : 'Aviso premium sem canal disponível.',
      this.nome,
    );
  }

  protected registrarLog(cliente: Cliente, relatorio: RelatorioProcessamento): void {
    relatorio.registrar('registrarLog', `Log detalhado de ${cliente.nome} com trilha premium.`, this.nome);
  }
}

export const GANCHOS = ['validar', 'aplicarBeneficios', 'notificar', 'registrarLog'] as const;

export function sobrescreve(processamento: ProcessamentoClienteTemplate, metodo: string): boolean {
  return Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(processamento), metodo);
}

export class CatalogoProcessamentos {
  private readonly porPlano: Map<string, ProcessamentoClienteTemplate>;

  constructor(processamentos: readonly ProcessamentoClienteTemplate[]) {
    this.porPlano = new Map(processamentos.map((processamento) => [processamento.plano(), processamento]));
  }

  processar(cliente: Cliente, plano: string): RelatorioProcessamento {
    const processamento = this.porPlano.get(plano.trim().toLowerCase());
    if (!processamento) {
      throw new Error(`Plano desconhecido: ${plano}. Use [${[...this.porPlano.keys()].join(', ')}].`);
    }
    return processamento.processar(cliente);
  }

  planos(): string[] {
    return [...this.porPlano.keys()];
  }

  porNome(plano: string): ProcessamentoClienteTemplate | undefined {
    return this.porPlano.get(plano);
  }
}
