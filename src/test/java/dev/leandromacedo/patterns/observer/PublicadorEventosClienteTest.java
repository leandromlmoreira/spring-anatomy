package dev.leandromacedo.patterns.observer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;

import org.junit.jupiter.api.Test;

import dev.leandromacedo.patterns.builder.ClienteBuilder;
import dev.leandromacedo.patterns.model.Cliente;

class PublicadorEventosClienteTest {

    private final Cliente cliente = ClienteBuilder.novoCliente().comNome("Lívia Prado").comCep("01001-000").build();

    @Test
    void entregaCadaEventoAoMetodoCertoDeTodosOsObservers() {
        ClienteObserver primeiro = mock(ClienteObserver.class);
        ClienteObserver segundo = mock(ClienteObserver.class);
        PublicadorEventosCliente publicador = new PublicadorEventosCliente(List.of(primeiro, segundo));

        publicador.publicar(EventoCliente.CRIADO, cliente);
        publicador.publicar(EventoCliente.ATUALIZADO, cliente);
        publicador.publicar(EventoCliente.REMOVIDO, cliente);

        verify(primeiro).onClienteCriado(cliente);
        verify(segundo).onClienteCriado(cliente);
        verify(primeiro).onClienteAtualizado(cliente);
        verify(segundo).onClienteRemovido(cliente);
    }

    @Test
    void falhaDeUmObserverNaoImpedeOsOutros() {
        ClienteObserver quebrado = mock(ClienteObserver.class);
        doThrow(new IllegalStateException("fora do ar")).when(quebrado).onClienteCriado(cliente);
        AuditoriaObserver auditoria = new AuditoriaObserver();
        PublicadorEventosCliente publicador = new PublicadorEventosCliente(List.of(quebrado, auditoria));

        publicador.publicar(EventoCliente.CRIADO, cliente);

        assertThat(auditoria.trilha()).extracting(RegistroAuditoria::evento).containsExactly(EventoCliente.CRIADO);
    }

    @Test
    void auditoriaGuardaOsEventosMaisRecentesPrimeiroEComLimite() {
        AuditoriaObserver auditoria = new AuditoriaObserver();

        for (int i = 0; i < AuditoriaObserver.CAPACIDADE + 5; i++) {
            auditoria.onClienteAtualizado(cliente);
        }
        auditoria.onClienteRemovido(cliente);

        assertThat(auditoria.trilha()).hasSize(AuditoriaObserver.CAPACIDADE);
        assertThat(auditoria.trilha().get(0).evento()).isEqualTo(EventoCliente.REMOVIDO);
    }
}
