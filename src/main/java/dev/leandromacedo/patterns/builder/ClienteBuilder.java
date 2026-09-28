package dev.leandromacedo.patterns.builder;

import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Endereco;

public final class ClienteBuilder {

    private final Cliente cliente = new Cliente();
    private final Endereco endereco = new Endereco();

    private ClienteBuilder() {
    }

    public static ClienteBuilder novoCliente() {
        return new ClienteBuilder();
    }

    public ClienteBuilder comNome(String nome) {
        cliente.setNome(nome);
        return this;
    }

    public ClienteBuilder comCep(String cep) {
        endereco.setCep(cep);
        return this;
    }

    public ClienteBuilder comLogradouro(String logradouro) {
        endereco.setLogradouro(logradouro);
        return this;
    }

    public ClienteBuilder comComplemento(String complemento) {
        endereco.setComplemento(complemento);
        return this;
    }

    public ClienteBuilder comBairro(String bairro) {
        endereco.setBairro(bairro);
        return this;
    }

    public ClienteBuilder comCidade(String cidade) {
        endereco.setLocalidade(cidade);
        return this;
    }

    public ClienteBuilder comUf(String uf) {
        endereco.setUf(uf);
        return this;
    }

    public Cliente build() {
        if (cliente.getNome() == null || cliente.getNome().isBlank()) {
            throw new IllegalStateException("Um cliente precisa de nome antes do build().");
        }
        cliente.setEndereco(endereco);
        return cliente;
    }
}
