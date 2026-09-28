package dev.leandromacedo.patterns.adapter;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import dev.leandromacedo.patterns.model.Notificacao;

@Service
public class DespachanteNotificacao {

    private static final Logger log = LoggerFactory.getLogger(DespachanteNotificacao.class);

    private final List<CanalNotificacao> canais;

    public DespachanteNotificacao(List<CanalNotificacao> canais) {
        this.canais = canais;
    }

    public boolean enviar(Notificacao notificacao) {
        Optional<CanalNotificacao> canal = canais.stream()
                .filter(candidato -> candidato.suporta(notificacao.getTipo()))
                .findFirst();
        if (canal.isEmpty()) {
            log.warn("Nenhum canal registrado para {}", notificacao.getTipo());
            return false;
        }
        canal.get().enviar(notificacao);
        notificacao.marcarComoEnviada();
        return true;
    }
}
