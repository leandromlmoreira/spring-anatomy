package dev.leandromacedo.patterns.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import dev.leandromacedo.patterns.adapter.gateway.OperadoraSms;
import dev.leandromacedo.patterns.adapter.gateway.ProvedorPush;
import dev.leandromacedo.patterns.adapter.gateway.ServidorSmtp;
import dev.leandromacedo.patterns.builder.ClienteBuilder;
import dev.leandromacedo.patterns.factory.NotificacaoFactory;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Notificacao;

class DespachanteNotificacaoTest {

    private final ServidorSmtp smtp = mock(ServidorSmtp.class);
    private final OperadoraSms operadora = mock(OperadoraSms.class);
    private final ProvedorPush push = mock(ProvedorPush.class);
    private final DespachanteNotificacao despachante = new DespachanteNotificacao(List.of(
            new EmailNotificacaoAdapter(smtp),
            new SmsNotificacaoAdapter(operadora),
            new PushNotificacaoAdapter(push)));
    private final Cliente cliente = ClienteBuilder.novoCliente().comNome("Caio Brandão").comCep("01001-000").build();

    @Test
    void traduzEmailParaAInterfaceDoServidorSmtp() {
        Notificacao notificacao = NotificacaoFactory.criar("EMAIL", "Seu boleto venceu", cliente);

        assertThat(despachante.enviar(notificacao)).isTrue();

        verify(smtp).transmitir("Caio Brandão", EmailNotificacaoAdapter.ASSUNTO, "<p>Seu boleto venceu</p>");
        assertThat(notificacao.isEnviada()).isTrue();
    }

    @Test
    void traduzSmsParaAOperadora() {
        despachante.enviar(NotificacaoFactory.criar("SMS", "Código 4821", cliente));

        verify(operadora).dispararTexto("Caio Brandão", "Código 4821");
        verify(smtp, never()).transmitir(anyString(), anyString(), anyString());
    }

    @Test
    void montaOPayloadExigidoPeloProvedorPush() {
        despachante.enviar(NotificacaoFactory.criar("PUSH", "Pedido enviado", cliente));

        verify(push).publicar(Map.of("destino", "Caio Brandão", "titulo", PushNotificacaoAdapter.TITULO,
                "corpo", "Pedido enviado"));
    }

    @Test
    void naoMarcaComoEnviadaQuandoNenhumCanalSuportaOTipo() {
        Notificacao notificacao = NotificacaoFactory.criar("WHATSAPP", "Oi", cliente);

        assertThat(despachante.enviar(notificacao)).isFalse();

        assertThat(notificacao.isEnviada()).isFalse();
        verify(push, never()).publicar(any());
        verify(operadora, never()).dispararTexto(anyString(), eq("Oi"));
    }

    @Test
    void cortaMensagensLongasParaCaberNoSms() {
        String longa = "a".repeat(200);

        String ajustada = SmsNotificacaoAdapter.caberNoSms(longa);

        assertThat(ajustada).hasSize(OperadoraSms.LIMITE_CARACTERES).endsWith("...");
        assertThat(SmsNotificacaoAdapter.caberNoSms("curta")).isEqualTo("curta");
    }
}
