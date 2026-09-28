import { Cliente, Endereco } from './modelo';
import { criarLog } from './rastro';

const log = criarLog('ClienteBuilder');

export class ClienteBuilder {
  private readonly cliente = new Cliente();
  private readonly endereco = new Endereco();

  private constructor() {}

  static novoCliente(): ClienteBuilder {
    log.info('novoCliente', 'Builder vazio criado.');
    return new ClienteBuilder();
  }

  comNome(nome: string | undefined): this {
    this.cliente.nome = nome;
    return this.anotar('comNome', nome);
  }

  comCep(cep: string | undefined): this {
    this.endereco.cep = cep;
    return this.anotar('comCep', cep);
  }

  comLogradouro(logradouro: string | undefined): this {
    this.endereco.logradouro = logradouro;
    return this.anotar('comLogradouro', logradouro);
  }

  comComplemento(complemento: string | undefined): this {
    this.endereco.complemento = complemento;
    return this.anotar('comComplemento', complemento);
  }

  comBairro(bairro: string | undefined): this {
    this.endereco.bairro = bairro;
    return this.anotar('comBairro', bairro);
  }

  comCidade(cidade: string | undefined): this {
    this.endereco.localidade = cidade;
    return this.anotar('comCidade', cidade);
  }

  comUf(uf: string | undefined): this {
    this.endereco.uf = uf;
    return this.anotar('comUf', uf);
  }

  build(): Cliente {
    if (!this.cliente.nome || this.cliente.nome.trim() === '') {
      log.erro('build', 'Um cliente precisa de nome antes do build().');
      throw new Error('Um cliente precisa de nome antes do build().');
    }
    this.cliente.endereco = this.endereco;
    log.ok('build', `Cliente "${this.cliente.nome}" montado.`);
    return this.cliente;
  }

  private anotar(metodo: string, valor: string | undefined): this {
    log.info(metodo, valor === undefined || valor === '' ? 'sem valor, campo segue vazio' : `"${valor}"`);
    return this;
  }
}
