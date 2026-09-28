import {
  CanalNotificacao,
  DespachanteNotificacao,
  EmailNotificacaoAdapter,
  OperadoraSms,
  ProvedorPush,
  PushNotificacaoAdapter,
  ServidorSmtp,
  SmsNotificacaoAdapter,
} from './adapter';
import { ContainerSpring } from './container';
import { ClienteRestController } from './controller';
import { AuditoriaObserver, NotificacaoObserver, PublicadorEventosCliente } from './observer';
import { ClienteRepository, EnderecoRepository, NotificacaoRepository } from './repositorios';
import { ClienteServiceImpl } from './servico';
import { ConsultaEndereco, ConsultaEnderecoOffline, NomeEstrategia, ViaCepConsultaEndereco } from './strategy';
import { CatalogoProcessamentos, ProcessamentoClientePadrao, ProcessamentoClientePremium } from './template';

export interface OpcoesSistema {
  estrategia?: NomeEstrategia;
  buscar?: typeof fetch;
}

type Ouvinte = () => void;

export class Sistema {
  readonly clientes = new ClienteRepository();
  readonly enderecos = new EnderecoRepository();
  readonly notificacoes = new NotificacaoRepository();
  readonly canais: readonly CanalNotificacao[] = [
    new EmailNotificacaoAdapter(new ServidorSmtp()),
    new SmsNotificacaoAdapter(new OperadoraSms()),
    new PushNotificacaoAdapter(new ProvedorPush()),
  ];
  readonly despachante = new DespachanteNotificacao(this.canais);
  readonly auditoria = new AuditoriaObserver();
  readonly publicador = new PublicadorEventosCliente([
    new NotificacaoObserver(this.notificacoes, this.despachante),
    this.auditoria,
  ]);
  readonly processamentos = new CatalogoProcessamentos([
    new ProcessamentoClientePadrao(),
    new ProcessamentoClientePremium(this.despachante, this.notificacoes),
  ]);
  readonly container = new ContainerSpring();
  estrategia: NomeEstrategia;
  clienteService: ClienteServiceImpl;
  controller: ClienteRestController;
  private readonly ouvintes = new Set<Ouvinte>();

  constructor(private readonly opcoes: OpcoesSistema = {}) {
    this.estrategia = opcoes.estrategia ?? 'viacep';
    this.clienteService = this.montarServico();
    this.controller = new ClienteRestController(this.clienteService);
    ['ClienteServiceImpl', 'DespachanteNotificacao', 'PublicadorEventosCliente'].forEach((classe) =>
      this.container.registrar(classe),
    );
  }

  usarEstrategia(estrategia: NomeEstrategia): void {
    this.estrategia = estrategia;
    this.clienteService = this.montarServico();
    this.controller = new ClienteRestController(this.clienteService);
    this.avisar();
  }

  aoMudar(ouvinte: Ouvinte): () => void {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  }

  avisar(): void {
    this.ouvintes.forEach((ouvinte) => ouvinte());
  }

  private montarServico(): ClienteServiceImpl {
    return new ClienteServiceImpl(this.clientes, this.enderecos, this.notificacoes, this.criarConsulta(), this.publicador);
  }

  private criarConsulta(): ConsultaEndereco {
    return this.estrategia === 'offline'
      ? new ConsultaEnderecoOffline()
      : new ViaCepConsultaEndereco(this.opcoes.buscar);
  }
}
