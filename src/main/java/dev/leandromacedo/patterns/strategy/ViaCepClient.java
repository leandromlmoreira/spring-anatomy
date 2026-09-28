package dev.leandromacedo.patterns.strategy;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;

public interface ViaCepClient {

    @GetExchange("/{cep}/json/")
    ViaCepResposta buscar(@PathVariable String cep);
}
