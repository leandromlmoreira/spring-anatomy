package dev.leandromacedo.patterns.model;

import java.util.Arrays;
import java.util.Locale;

public enum TipoNotificacao {
    EMAIL,
    SMS,
    PUSH,
    WHATSAPP;

    public static TipoNotificacao de(String valor) {
        String normalizado = valor == null ? "" : valor.trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(tipo -> tipo.name().equals(normalizado))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo de notificação não suportado: " + valor));
    }
}
