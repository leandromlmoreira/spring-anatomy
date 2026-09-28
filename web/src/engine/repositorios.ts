import { Cliente, Endereco, Notificacao } from './modelo';
import { criarLog } from './rastro';

export class EnderecoRepository {
  private readonly log = criarLog('EnderecoRepository');
  private readonly porCep = new Map<string, Endereco>();

  findById(cep: string): Endereco | undefined {
    const endereco = this.porCep.get(cep);
    this.log.info('findById', endereco ? `CEP ${cep} já está em cache.` : `CEP ${cep} ainda não está em cache.`);
    return endereco;
  }

  save(endereco: Endereco): Endereco {
    this.porCep.set(endereco.cep ?? '', endereco);
    return endereco;
  }

  count(): number {
    return this.porCep.size;
  }
}

export class ClienteRepository {
  private readonly log = criarLog('ClienteRepository');
  private readonly porId = new Map<number, Cliente>();
  private proximoId = 1;

  findAll(): Cliente[] {
    return [...this.porId.values()];
  }

  findById(id: number): Cliente | undefined {
    return this.porId.get(id);
  }

  save(cliente: Cliente): Cliente {
    if (cliente.id === undefined) {
      cliente.id = this.proximoId++;
      cliente.criadoEm = new Date();
    }
    this.porId.set(cliente.id, cliente);
    this.log.info('save', `Cliente #${cliente.id} gravado.`);
    return cliente;
  }

  delete(cliente: Cliente): void {
    this.porId.delete(cliente.id ?? -1);
    this.log.info('delete', `Cliente #${cliente.id} apagado.`);
  }
}

export class NotificacaoRepository {
  private readonly notificacoes: Notificacao[] = [];
  private proximoId = 1;

  findAll(): Notificacao[] {
    return [...this.notificacoes];
  }

  findByClienteId(clienteId: number): Notificacao[] {
    return this.notificacoes.filter((notificacao) => notificacao.cliente.id === clienteId);
  }

  save(notificacao: Notificacao): Notificacao {
    if (notificacao.id === undefined) {
      notificacao.id = this.proximoId++;
      this.notificacoes.push(notificacao);
    }
    return notificacao;
  }

  deleteByClienteId(clienteId: number): void {
    const restantes = this.notificacoes.filter((notificacao) => notificacao.cliente.id !== clienteId);
    this.notificacoes.splice(0, this.notificacoes.length, ...restantes);
  }
}
