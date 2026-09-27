package dev.leandromacedo.patterns.adapter;

import java.util.Map;

import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.adapter.gateway.ProvedorPush;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.model.TipoNotificacao;

@Component
public class PushNotificacaoAdapter implements CanalNotificacao {

    static final String TITULO = "Spring Anatomy";

    private final ProvedorPush provedorPush;

    public PushNotificacaoAdapter(ProvedorPush provedorPush) {
        this.provedorPush = provedorPush;
    }

    @Override
    public boolean suporta(TipoNotificacao tipo) {
        return tipo == TipoNotificacao.PUSH;
    }

    @Override
    public void enviar(Notificacao notificacao) {
        provedorPush.publicar(Map.of(
                "destino", notificacao.getCliente().getNome(),
                "titulo", TITULO,
                "corpo", notificacao.getMensagem()));
    }
}
