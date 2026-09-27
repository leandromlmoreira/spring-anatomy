package dev.leandromacedo.patterns.strategy;

import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.model.Endereco;

@Component
@ConditionalOnProperty(name = "anatomy.endereco.estrategia", havingValue = "viacep", matchIfMissing = true)
public class ViaCepConsultaEndereco implements ConsultaEndereco {

    private final ViaCepClient viaCepClient;

    public ViaCepConsultaEndereco(ViaCepClient viaCepClient) {
        this.viaCepClient = viaCepClient;
    }

    @Override
    public Optional<Endereco> consultar(String cep) {
        ViaCepResposta resposta = viaCepClient.buscar(cep);
        if (resposta == null || !resposta.encontrado()) {
            return Optional.empty();
        }
        return Optional.of(resposta.paraEndereco(cep));
    }
}
