package dev.leandromacedo.patterns.builder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import dev.leandromacedo.patterns.model.Cliente;

class ClienteBuilderTest {

    @Test
    void montaClienteComEnderecoPassoAPasso() {
        Cliente cliente = ClienteBuilder.novoCliente()
                .comNome("Tomás Aguiar")
                .comCep("20040-020")
                .comLogradouro("Avenida Rio Branco")
                .comComplemento("Sala 902")
                .comBairro("Centro")
                .comCidade("Rio de Janeiro")
                .comUf("RJ")
                .build();

        assertThat(cliente.getNome()).isEqualTo("Tomás Aguiar");
        assertThat(cliente.getEndereco().getCep()).isEqualTo("20040-020");
        assertThat(cliente.getEndereco().getLogradouro()).isEqualTo("Avenida Rio Branco");
        assertThat(cliente.getEndereco().getComplemento()).isEqualTo("Sala 902");
        assertThat(cliente.getEndereco().getBairro()).isEqualTo("Centro");
        assertThat(cliente.getEndereco().getLocalidade()).isEqualTo("Rio de Janeiro");
        assertThat(cliente.getEndereco().getUf()).isEqualTo("RJ");
    }

    @Test
    void camposOpcionaisFicamVazios() {
        Cliente cliente = ClienteBuilder.novoCliente().comNome("Iara Nogueira").comCep("01001000").build();

        assertThat(cliente.getEndereco().getLogradouro()).isNull();
        assertThat(cliente.getEndereco().getUf()).isNull();
    }

    @Test
    void naoConstroiClienteSemNome() {
        assertThatThrownBy(() -> ClienteBuilder.novoCliente().comCep("01001-000").build())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("nome");
    }
}
