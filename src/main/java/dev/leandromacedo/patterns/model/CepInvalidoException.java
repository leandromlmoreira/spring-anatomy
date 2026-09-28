package dev.leandromacedo.patterns.model;

public class CepInvalidoException extends IllegalArgumentException {

    public CepInvalidoException(String valor) {
        super("CEP inválido: " + valor + ". Use 8 dígitos, como 01001-000.");
    }
}
