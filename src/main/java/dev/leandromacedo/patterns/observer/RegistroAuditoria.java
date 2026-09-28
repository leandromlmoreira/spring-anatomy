package dev.leandromacedo.patterns.observer;

import java.time.Instant;

public record RegistroAuditoria(EventoCliente evento, Long clienteId, String cliente, Instant instante) {
}
