package dev.leandromacedo.patterns.template;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import dev.leandromacedo.patterns.adapter.DespachanteNotificacao;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.repository.NotificacaoRepository;
import dev.leandromacedo.patterns.template.RelatorioProcessamento.Etapa;

class ProcessamentoClienteTemplateTest {

    private final DespachanteNotificacao despachante = mock(DespachanteNotificacao.class);
    private final NotificacaoRepository repository = mock(NotificacaoRepository.class);
    private final ProcessamentoClientePremium premium = new ProcessamentoClientePremium(despachante, repository);
    private final ProcessamentoClientePadrao padrao = new ProcessamentoClientePadrao();

    @Test
    void premiumSegueOEsqueletoESobrescreveOsGanchos() {
        when(despachante.enviar(any())).thenReturn(true);

        RelatorioProcessamento relatorio = premium.processar(cliente("Helena Vasconcelos"));

        assertThat(relatorio.isConcluido()).isTrue();
        assertThat(relatorio.getEtapas()).extracting(Etapa::metodo)
                .containsExactly("validar", "aplicarBeneficios", "notificar", "registrarLog");
        assertThat(relatorio.getEtapas().get(2).descricao()).isEqualTo("Aviso premium enviado por EMAIL.");
        verify(repository).save(any(Notificacao.class));
    }

    @Test
    void padraoUsaOsGanchosHerdados() {
        RelatorioProcessamento relatorio = padrao.processar(cliente("Otávio Reis"));

        assertThat(relatorio.getPlano()).isEqualTo("padrao");
        assertThat(relatorio.getEtapas().get(2).descricao()).isEqualTo("Plano sem aviso extra.");
        assertThat(relatorio.getEtapas().get(3).descricao()).isEqualTo("Log resumido de Otávio Reis.");
    }

    @Test
    void interrompeQuandoOClienteEInvalido() {
        RelatorioProcessamento relatorio = premium.processar(cliente(" "));

        assertThat(relatorio.isConcluido()).isFalse();
        assertThat(relatorio.getEtapas()).extracting(Etapa::metodo).containsExactly("validar");
        verify(despachante, never()).enviar(any());
    }

    @Test
    void catalogoEscolheOProcessamentoPeloPlano() {
        CatalogoProcessamentos catalogo = new CatalogoProcessamentos(List.of(premium, padrao));

        assertThat(catalogo.processar(cliente("Rui"), "PADRAO").getPlano()).isEqualTo("padrao");
        assertThatThrownBy(() -> catalogo.processar(cliente("Rui"), "ouro"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Plano desconhecido");
    }

    private static Cliente cliente(String nome) {
        Cliente cliente = new Cliente();
        cliente.setNome(nome);
        return cliente;
    }
}
