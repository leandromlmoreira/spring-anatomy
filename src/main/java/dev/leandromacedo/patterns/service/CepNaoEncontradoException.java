package dev.leandromacedo.patterns.service;

public class CepNaoEncontradoException extends RuntimeException {

    public CepNaoEncontradoException(String cep) {
        super("O CEP " + cep + " não existe na base consultada.");
    }
}
