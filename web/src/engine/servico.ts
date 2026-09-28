import { Cliente, Endereco, normalizarCep } from './modelo';
import { PublicadorEventosCliente } from './observer';
import { criarLog } from './rastro';
import { ClienteRepository, EnderecoRepository, NotificacaoRepository } from './repositorios';
import { ConsultaEndereco } from './strategy';

export class RecursoNaoEncontradoError extends Error {}

export class CepNaoEncontradoError extends Error {
  constructor(cep: string) {
    super(`O CEP ${cep} não existe na base consultada.`);
  }
}

export interface ClienteService {
  buscarTodos(): Cliente[];
  buscarPorId(id: number): Cliente;
  inserir(cliente: Cliente): Promise<Cliente>;
  atualizar(id: number, dados: Cliente): Promise<Cliente>;
  remover(id: number): void;
}

export class ClienteServiceImpl implements ClienteService {
  private readonly log = criarLog('ClienteServiceImpl');

  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly enderecoRepository: EnderecoRepository,
    private readonly notificacaoRepository: NotificacaoRepository,
    readonly consultaEndereco: ConsultaEndereco,
    private readonly publicador: PublicadorEventosCliente,
  ) {}

  buscarTodos(): Cliente[] {
    return this.clienteRepository.findAll();
  }

  buscarPorId(id: number): Cliente {
    const cliente = this.clienteRepository.findById(id);
    if (!cliente) {
      throw new RecursoNaoEncontradoError(`Cliente ${id} não encontrado.`);
    }
    return cliente;
  }

  async inserir(cliente: Cliente): Promise<Cliente> {
    this.log.info('inserir', `Cadastrando ${cliente.nome}.`);
    const salvo = await this.salvarComEndereco(cliente, cliente.endereco);
    this.publicador.publicar('CRIADO', salvo);
    return salvo;
  }

  async atualizar(id: number, dados: Cliente): Promise<Cliente> {
    const existente = this.buscarPorId(id);
    this.log.info('atualizar', `Atualizando cliente #${id}.`);
    existente.nome = dados.nome;
    const salvo = await this.salvarComEndereco(existente, dados.endereco);
    this.publicador.publicar('ATUALIZADO', salvo);
    return salvo;
  }

  remover(id: number): void {
    const cliente = this.buscarPorId(id);
    this.log.info('remover', `Removendo cliente #${id}.`);
    this.publicador.publicar('REMOVIDO', cliente);
    this.notificacaoRepository.deleteByClienteId(id);
    this.clienteRepository.delete(cliente);
  }

  private async salvarComEndereco(cliente: Cliente, informado: Endereco | undefined): Promise<Cliente> {
    const cep = normalizarCep(informado?.cep);
    const endereco = this.enderecoRepository.findById(cep) ?? (await this.consultar(cep));
    if (informado) {
      endereco.mesclar(informado);
    }
    cliente.endereco = this.enderecoRepository.save(endereco);
    return this.clienteRepository.save(cliente);
  }

  private async consultar(cep: string): Promise<Endereco> {
    this.log.info('consultar', `Delegando para a estratégia ${this.consultaEndereco.nome}.`);
    const endereco = await this.consultaEndereco.consultar(cep);
    if (!endereco) {
      this.log.erro('consultar', `O CEP ${cep} não existe na base consultada.`);
      throw new CepNaoEncontradoError(cep);
    }
    return endereco;
  }
}
