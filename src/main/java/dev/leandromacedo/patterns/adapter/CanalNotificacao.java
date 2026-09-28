package dev.leandromacedo.patterns.adapter;

import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.model.TipoNotificacao;

public interface CanalNotificacao {

    boolean suporta(TipoNotificacao tipo);

    void enviar(Notificacao notificacao);
}
