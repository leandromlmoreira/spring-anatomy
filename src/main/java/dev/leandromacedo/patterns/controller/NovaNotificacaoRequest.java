package dev.leandromacedo.patterns.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NovaNotificacaoRequest(
        @NotBlank(message = "Informe o tipo da notificação.") String tipo,
        @NotBlank(message = "Informe a mensagem.") String mensagem,
        @NotNull(message = "Informe o cliente.") Long clienteId) {
}
