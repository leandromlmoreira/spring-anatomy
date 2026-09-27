package dev.leandromacedo.patterns.strategy;

import java.util.Optional;

import dev.leandromacedo.patterns.model.Endereco;

public interface ConsultaEndereco {

    Optional<Endereco> consultar(String cep);
}
