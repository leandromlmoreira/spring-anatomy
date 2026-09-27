package dev.leandromacedo.patterns.adapter.gateway;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ServidorSmtp {

    private static final Logger log = LoggerFactory.getLogger(ServidorSmtp.class);

    public String transmitir(String destinatario, String assunto, String corpoHtml) {
        String protocolo = "smtp-" + UUID.randomUUID().toString().substring(0, 8);
        log.info("{} para {} | {} | {}", protocolo, destinatario, assunto, corpoHtml);
        return protocolo;
    }
}
