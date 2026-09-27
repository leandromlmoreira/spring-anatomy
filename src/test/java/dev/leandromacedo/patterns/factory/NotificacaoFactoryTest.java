package dev.leandromacedo.patterns.factory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import dev.leandromacedo.patterns.builder.ClienteBuilder;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.model.TipoNotificacao;

class NotificacaoFactoryTest {

    private final Cliente cliente = ClienteBuilder.novoCliente().comNome("Marina Duarte").comCep("01001-000").build();

    @Test
    void criaCadaEventoNoCanalCerto() {
        assertThat(NotificacaoFactory.boasVindas(cliente).getTipo()).isEqualTo(TipoNotificacao.EMAIL);
        assertThat(NotificacaoFactory.atualizacao(cliente).getTipo()).isEqualTo(TipoNotificacao.SMS);
        assertThat(NotificacaoFactory.remocao(cliente).getTipo()).isEqualTo(TipoNotificacao.PUSH);
        assertThat(NotificacaoFactory.premium(cliente).getTipo()).isEqualTo(TipoNotificacao.EMAIL);
    }

    @Test
    void personalizaAMensagemComONomeDoCliente() {
        Notificacao notificacao = NotificacaoFactory.boasVindas(cliente);

        assertThat(notificacao.getMensagem()).isEqualTo("Bem-vindo(a), Marina Duarte! Seu cadastro foi realizado com sucesso.");
        assertThat(notificacao.getCliente()).isSameAs(cliente);
        assertThat(notificacao.isEnviada()).isFalse();
    }

    @Test
    void aceitaOTipoEmTextoSemDiferenciarMaiusculas() {
        Notificacao notificacao = NotificacaoFactory.criar(" whatsapp ", "Pedido saiu para entrega", cliente);

        assertThat(notificacao.getTipo()).isEqualTo(TipoNotificacao.WHATSAPP);
        assertThat(notificacao.getMensagem()).isEqualTo("Pedido saiu para entrega");
    }

    @Test
    void recusaTipoDesconhecido() {
        assertThatThrownBy(() -> NotificacaoFactory.criar("fax", "Olá", cliente))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Tipo de notificação não suportado: fax");
    }

    @Test
    void recusaMensagemVazia() {
        assertThatThrownBy(() -> NotificacaoFactory.criar("sms", "  ", cliente))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mensagem");
    }
}
