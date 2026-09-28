package dev.leandromacedo.patterns.strategy;

import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.model.Endereco;

@Component
@ConditionalOnProperty(name = "anatomy.endereco.estrategia", havingValue = "offline")
public class ConsultaEnderecoOffline implements ConsultaEndereco {

    @Override
    public Optional<Endereco> consultar(String cep) {
        return Optional.of(new Endereco(cep));
    }
}
