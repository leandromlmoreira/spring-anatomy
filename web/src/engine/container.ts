import { criarLog } from './rastro';

export type Escopo = 'singleton' | 'prototype';

export interface Instancia {
  readonly classe: string;
  readonly hash: string;
}

interface Definicao {
  readonly classe: string;
  escopo: Escopo;
}

const log = criarLog('ApplicationContext');

export class ContainerSpring {
  private readonly definicoes = new Map<string, Definicao>();
  private readonly singletons = new Map<string, Instancia>();
  private proximoHash = 0x1b2c3d;
  instanciasCriadas = 0;

  registrar(classe: string, escopo: Escopo = 'singleton'): void {
    this.definicoes.set(classe, { classe, escopo });
  }

  mudarEscopo(classe: string, escopo: Escopo): void {
    const definicao = this.definir(classe);
    definicao.escopo = escopo;
    this.singletons.delete(classe);
    this.instanciasCriadas = 0;
  }

  escopo(classe: string): Escopo {
    return this.definir(classe).escopo;
  }

  getBean(classe: string): Instancia {
    const definicao = this.definir(classe);
    const existente = this.singletons.get(classe);
    if (definicao.escopo === 'singleton' && existente) {
      log.ok('getBean', `${classe}@${existente.hash} reaproveitado do cache de singletons.`);
      return existente;
    }
    const nova = this.instanciar(classe);
    if (definicao.escopo === 'singleton') {
      this.singletons.set(classe, nova);
    }
    return nova;
  }

  private instanciar(classe: string): Instancia {
    this.proximoHash += 0x2f7a1;
    this.instanciasCriadas += 1;
    const instancia = { classe, hash: this.proximoHash.toString(16) };
    log.info('getBean', `new ${classe}() -> ${classe}@${instancia.hash}`);
    return instancia;
  }

  private definir(classe: string): Definicao {
    const definicao = this.definicoes.get(classe);
    if (!definicao) {
      throw new Error(`No qualifying bean of type '${classe}' available`);
    }
    return definicao;
  }
}
