package dev.leandromacedo.patterns.adapter;

import dev.leandromacedo.patterns.model.TipoNotificacao;

public class CanalIndisponivelException extends RuntimeException {

    public CanalIndisponivelException(TipoNotificacao tipo) {
        super("Nenhum canal registrado para " + tipo + ".");
    }
}
