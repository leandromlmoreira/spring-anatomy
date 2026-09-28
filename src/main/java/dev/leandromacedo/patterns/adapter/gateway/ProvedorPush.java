package dev.leandromacedo.patterns.adapter.gateway;

import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ProvedorPush {

    private static final Set<String> CAMPOS_OBRIGATORIOS = Set.of("destino", "titulo", "corpo");
    private static final Logger log = LoggerFactory.getLogger(ProvedorPush.class);

    public void publicar(Map<String, String> payload) {
        if (!payload.keySet().containsAll(CAMPOS_OBRIGATORIOS)) {
            throw new IllegalArgumentException("Payload de push incompleto: " + payload.keySet());
        }
        log.info("Push publicado: {}", payload);
    }
}
