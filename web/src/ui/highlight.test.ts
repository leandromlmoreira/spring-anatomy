import { describe, expect, it } from 'vitest';
import { localizarMetodo, tokenizar } from './highlight';

const CLASSE = `@Service
public class DespachanteNotificacao {

    private final List<CanalNotificacao> canais;

    public boolean enviar(Notificacao notificacao) {
        if (canal.isEmpty()) {
            return false;
        }
        return true;
    }

    boolean suporta(TipoNotificacao tipo);
}`.split('\n');

describe('tokenizar', () => {
  it('classifica anotação, palavra-chave, tipo, método e texto', () => {
    const tokens = tokenizar('    @GetExchange("/{cep}/json/") ViaCepResposta buscar(String cep);');
    const porTipo = (tipo: string) => tokens.filter((token) => token.tipo === tipo).map((token) => token.valor);
    expect(porTipo('anotacao')).toEqual(['@GetExchange']);
    expect(porTipo('texto')).toEqual(['"/{cep}/json/"']);
    expect(porTipo('tipo')).toEqual(['ViaCepResposta', 'String']);
    expect(porTipo('metodo')).toEqual(['buscar']);
    expect(tokens.map((token) => token.valor).join('')).toBe('    @GetExchange("/{cep}/json/") ViaCepResposta buscar(String cep);');
  });

  it('reconhece palavras reservadas e números', () => {
    const tokens = tokenizar('private static final int DIGITOS = 8;');
    expect(tokens.filter((token) => token.tipo === 'palavra').map((token) => token.valor)).toEqual(['private', 'static', 'final', 'int']);
    expect(tokens.find((token) => token.tipo === 'numero')?.valor).toBe('8');
  });
});

describe('localizarMetodo', () => {
  it('encontra o corpo inteiro do método pelas chaves', () => {
    expect(localizarMetodo(CLASSE, 'enviar')).toEqual({ inicio: 5, fim: 10 });
  });

  it('encontra declarações abstratas de uma linha', () => {
    expect(localizarMetodo(CLASSE, 'suporta')).toEqual({ inicio: 12, fim: 12 });
  });

  it('ignora chamadas e devolve vazio para o que não existe', () => {
    expect(localizarMetodo(['        return enviar(x);'], 'enviar')).toBeUndefined();
    expect(localizarMetodo(CLASSE, 'inexistente')).toBeUndefined();
  });
});
