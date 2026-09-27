package dev.leandromacedo.patterns.controller;

import dev.leandromacedo.patterns.builder.ClienteBuilder;
import dev.leandromacedo.patterns.model.Cliente;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ClienteRequest(
        @NotBlank(message = "Informe o nome do cliente.") String nome,
        @NotBlank(message = "Informe o CEP.")
        @Pattern(regexp = "\\d{5}-?\\d{3}", message = "O CEP precisa ter 8 dígitos.") String cep,
        String logradouro,
        String complemento,
        String bairro,
        String cidade,
        String uf) {

    public Cliente paraCliente() {
        return ClienteBuilder.novoCliente()
                .comNome(nome)
                .comCep(cep)
                .comLogradouro(logradouro)
                .comComplemento(complemento)
                .comBairro(bairro)
                .comCidade(cidade)
                .comUf(uf)
                .build();
    }
}
