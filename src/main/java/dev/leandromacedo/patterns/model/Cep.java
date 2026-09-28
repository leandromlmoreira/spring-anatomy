package dev.leandromacedo.patterns.model;

public final class Cep {

    private static final int DIGITOS = 8;

    private Cep() {
    }

    public static String normalizar(String valor) {
        String digitos = valor == null ? "" : valor.replaceAll("\\D", "");
        if (digitos.length() != DIGITOS) {
            throw new CepInvalidoException(valor);
        }
        return digitos;
    }
}
