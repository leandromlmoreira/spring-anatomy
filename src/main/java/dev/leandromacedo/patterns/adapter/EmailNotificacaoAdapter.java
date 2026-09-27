package dev.leandromacedo.patterns.adapter;

import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.adapter.gateway.ServidorSmtp;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.model.TipoNotificacao;

@Component
public class EmailNotificacaoAdapter implements CanalNotificacao {

    static final String ASSUNTO = "Aviso do Spring Anatomy";

    private final ServidorSmtp servidorSmtp;

    public EmailNotificacaoAdapter(ServidorSmtp servidorSmtp) {
        this.servidorSmtp = servidorSmtp;
    }

    @Override
    public boolean suporta(TipoNotificacao tipo) {
        return tipo == TipoNotificacao.EMAIL;
    }

    @Override
    public void enviar(Notificacao notificacao) {
        String corpoHtml = "<p>" + notificacao.getMensagem() + "</p>";
        servidorSmtp.transmitir(notificacao.getCliente().getNome(), ASSUNTO, corpoHtml);
    }
}
