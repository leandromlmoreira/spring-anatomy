package dev.leandromacedo.patterns.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class CepTest {

    @Test
    void removeMascaraEEspacos() {
        assertThat(Cep.normalizar(" 01001-000 ")).isEqualTo("01001000");
    }

    @Test
    void recusaCepComQuantidadeErradaDeDigitos() {
        assertThatThrownBy(() -> Cep.normalizar("0100-100")).isInstanceOf(CepInvalidoException.class);
        assertThatThrownBy(() -> Cep.normalizar(null)).isInstanceOf(CepInvalidoException.class);
    }

    @Test
    void enderecoInformadoSobrescreveSoOsCamposPreenchidos() {
        Endereco consultado = new Endereco("01001000");
        consultado.setLogradouro("Praça da Sé");
        consultado.setBairro("Sé");
        Endereco informado = new Endereco();
        informado.setLogradouro("  ");
        informado.setComplemento("Bloco B");

        consultado.mesclar(informado);

        assertThat(consultado.getLogradouro()).isEqualTo("Praça da Sé");
        assertThat(consultado.getComplemento()).isEqualTo("Bloco B");
        assertThat(consultado.getBairro()).isEqualTo("Sé");
    }
}
