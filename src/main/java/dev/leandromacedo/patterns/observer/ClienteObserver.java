package dev.leandromacedo.patterns.observer;

import dev.leandromacedo.patterns.model.Cliente;

public interface ClienteObserver {

    void onClienteCriado(Cliente cliente);

    void onClienteAtualizado(Cliente cliente);

    void onClienteRemovido(Cliente cliente);
}
