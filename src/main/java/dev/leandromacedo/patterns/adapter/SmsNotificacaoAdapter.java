package dev.leandromacedo.patterns.adapter;

import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.adapter.gateway.OperadoraSms;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.model.TipoNotificacao;

@Component
public class SmsNotificacaoAdapter implements CanalNotificacao {

    private static final String RETICENCIAS = "...";

    private final OperadoraSms operadoraSms;

    public SmsNotificacaoAdapter(OperadoraSms operadoraSms) {
        this.operadoraSms = operadoraSms;
    }

    @Override
    public boolean suporta(TipoNotificacao tipo) {
        return tipo == TipoNotificacao.SMS;
    }

    @Override
    public void enviar(Notificacao notificacao) {
        operadoraSms.dispararTexto(notificacao.getCliente().getNome(), caberNoSms(notificacao.getMensagem()));
    }

    static String caberNoSms(String texto) {
        int limite = OperadoraSms.LIMITE_CARACTERES;
        if (texto.length() <= limite) {
            return texto;
        }
        return texto.substring(0, limite - RETICENCIAS.length()) + RETICENCIAS;
    }
}
