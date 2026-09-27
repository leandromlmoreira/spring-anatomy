package dev.leandromacedo.patterns.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;

import dev.leandromacedo.patterns.model.Endereco;

class ViaCepConsultaEnderecoTest {

    private final ViaCepClient client = mock(ViaCepClient.class);
    private final ViaCepConsultaEndereco viaCep = new ViaCepConsultaEndereco(client);

    @Test
    void converteARespostaDoViaCepEmEndereco() {
        when(client.buscar("01001000")).thenReturn(new ViaCepResposta("01001-000", "Praça da Sé", "lado ímpar", "Sé",
                "São Paulo", "SP", "3550308", "11", null));

        Endereco endereco = viaCep.consultar("01001000").orElseThrow();

        assertThat(endereco.getCep()).isEqualTo("01001000");
        assertThat(endereco.getLogradouro()).isEqualTo("Praça da Sé");
        assertThat(endereco.getLocalidade()).isEqualTo("São Paulo");
        assertThat(endereco.getDdd()).isEqualTo("11");
    }

    @Test
    void cepInexistenteViraVazio() {
        when(client.buscar("99999999")).thenReturn(new ViaCepResposta(null, null, null, null, null, null, null, null, true));

        assertThat(viaCep.consultar("99999999")).isEmpty();
    }

    @Test
    void estrategiaOfflineDevolveSoOCep() {
        Optional<Endereco> endereco = new ConsultaEnderecoOffline().consultar("01001000");

        assertThat(endereco).get().extracting(Endereco::getCep, Endereco::getLogradouro).containsExactly("01001000", null);
    }
}
