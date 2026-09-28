import { ClienteBuilder } from './builder';
import { Cliente } from './modelo';
import { criarLog } from './rastro';
import { ClienteService } from './servico';

export interface ClienteRequest {
  nome: string;
  cep: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export class ValidacaoError extends Error {}

const log = criarLog('ClienteRestController');

export function validar(request: ClienteRequest): void {
  if (request.nome.trim() === '') {
    throw new ValidacaoError('Informe o nome do cliente.');
  }
  if (request.cep.trim() === '') {
    throw new ValidacaoError('Informe o CEP.');
  }
  if (!/^\d{5}-?\d{3}$/.test(request.cep.trim())) {
    throw new ValidacaoError('O CEP precisa ter 8 dígitos.');
  }
}

export function paraCliente(request: ClienteRequest): Cliente {
  return ClienteBuilder.novoCliente()
    .comNome(request.nome)
    .comCep(request.cep)
    .comLogradouro(request.logradouro)
    .comComplemento(request.complemento)
    .comBairro(request.bairro)
    .comCidade(request.cidade)
    .comUf(request.uf)
    .build();
}

export class ClienteRestController {
  constructor(private readonly clienteService: ClienteService) {}

  async inserir(request: ClienteRequest): Promise<Cliente> {
    log.info('inserir', `POST /clientes {"nome": "${request.nome}", "cep": "${request.cep}"}`);
    try {
      validar(request);
    } catch (erro) {
      log.erro('inserir', `400 Bad Request: ${(erro as Error).message}`);
      throw erro;
    }
    const cliente = await this.clienteService.inserir(paraCliente(request));
    log.ok('inserir', `201 Created: cliente #${cliente.id}`);
    return cliente;
  }
}
