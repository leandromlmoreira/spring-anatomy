package dev.leandromacedo.patterns.observer;

import java.util.function.BiConsumer;

import dev.leandromacedo.patterns.model.Cliente;

public enum EventoCliente {
    CRIADO(ClienteObserver::onClienteCriado),
    ATUALIZADO(ClienteObserver::onClienteAtualizado),
    REMOVIDO(ClienteObserver::onClienteRemovido);

    private final BiConsumer<ClienteObserver, Cliente> entrega;

    EventoCliente(BiConsumer<ClienteObserver, Cliente> entrega) {
        this.entrega = entrega;
    }

    void entregar(ClienteObserver observer, Cliente cliente) {
        entrega.accept(observer, cliente);
    }
}
