import { Endereco } from './modelo';
import { criarLog } from './rastro';

export type NomeEstrategia = 'viacep' | 'offline';

export interface ConsultaEndereco {
  readonly nome: string;
  consultar(cep: string): Promise<Endereco | undefined>;
}

export interface ViaCepResposta {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  ddd?: string;
  erro?: boolean | string;
}

export class ViaCepIndisponivelError extends Error {
  constructor() {
    super('ViaCEP indisponível agora. Tente de novo ou use a estratégia offline.');
  }
}

export function paraEndereco(resposta: ViaCepResposta, cepNormalizado: string): Endereco {
  const endereco = new Endereco(cepNormalizado);
  endereco.logradouro = resposta.logradouro;
  endereco.complemento = resposta.complemento;
  endereco.bairro = resposta.bairro;
  endereco.localidade = resposta.localidade;
  endereco.uf = resposta.uf;
  endereco.ibge = resposta.ibge;
  endereco.ddd = resposta.ddd;
  return endereco;
}

function encontrado(resposta: ViaCepResposta): boolean {
  return resposta.erro !== true && resposta.erro !== 'true';
}

export class ViaCepConsultaEndereco implements ConsultaEndereco {
  readonly nome = 'ViaCepConsultaEndereco';
  private readonly log = criarLog(this.nome);

  constructor(
    private readonly buscar: typeof fetch = (...args) => fetch(...args),
    private readonly url = 'https://viacep.com.br/ws',
  ) {}

  async consultar(cep: string): Promise<Endereco | undefined> {
    this.log.info('consultar', `GET ${this.url}/${cep}/json/`);
    const resposta = await this.requisitar(cep);
    if (!encontrado(resposta)) {
      this.log.aviso('consultar', `ViaCEP respondeu {"erro": true} para ${cep}.`);
      return undefined;
    }
    this.log.ok('consultar', `${resposta.logradouro || 'CEP geral'}, ${resposta.localidade}/${resposta.uf}`);
    return paraEndereco(resposta, cep);
  }

  private async requisitar(cep: string): Promise<ViaCepResposta> {
    try {
      const resposta = await this.buscar(`${this.url}/${cep}/json/`);
      if (!resposta.ok) {
        throw new ViaCepIndisponivelError();
      }
      return (await resposta.json()) as ViaCepResposta;
    } catch {
      this.log.erro('consultar', 'Falha de rede ao falar com o ViaCEP.');
      throw new ViaCepIndisponivelError();
    }
  }
}

export class ConsultaEnderecoOffline implements ConsultaEndereco {
  readonly nome = 'ConsultaEnderecoOffline';
  private readonly log = criarLog(this.nome);

  async consultar(cep: string): Promise<Endereco | undefined> {
    this.log.ok('consultar', `Sem rede: devolve só o CEP ${cep}.`);
    return new Endereco(cep);
  }
}
