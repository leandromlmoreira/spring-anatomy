package dev.leandromacedo.patterns.strategy;

import dev.leandromacedo.patterns.model.Endereco;

public record ViaCepResposta(
        String cep,
        String logradouro,
        String complemento,
        String bairro,
        String localidade,
        String uf,
        String ibge,
        String ddd,
        String erro) {

    boolean encontrado() {
        return !"true".equalsIgnoreCase(erro);
    }

    Endereco paraEndereco(String cepNormalizado) {
        Endereco endereco = new Endereco(cepNormalizado);
        endereco.setLogradouro(logradouro);
        endereco.setComplemento(complemento);
        endereco.setBairro(bairro);
        endereco.setLocalidade(localidade);
        endereco.setUf(uf);
        endereco.setIbge(ibge);
        endereco.setDdd(ddd);
        return endereco;
    }
}
