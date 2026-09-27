package dev.leandromacedo.patterns.adapter.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class OperadoraSms {

    public static final int LIMITE_CARACTERES = 160;
    private static final Logger log = LoggerFactory.getLogger(OperadoraSms.class);

    public void dispararTexto(String destino, String texto) {
        if (texto.length() > LIMITE_CARACTERES) {
            throw new IllegalArgumentException("SMS acima de " + LIMITE_CARACTERES + " caracteres.");
        }
        log.info("SMS para {}: {}", destino, texto);
    }
}
