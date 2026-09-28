package dev.leandromacedo.patterns.observer;

import java.time.Instant;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.model.Cliente;

@Component
public class AuditoriaObserver implements ClienteObserver {

    static final int CAPACIDADE = 50;

    private final Deque<RegistroAuditoria> trilha = new ConcurrentLinkedDeque<>();

    @Override
    public void onClienteCriado(Cliente cliente) {
        registrar(EventoCliente.CRIADO, cliente);
    }

    @Override
    public void onClienteAtualizado(Cliente cliente) {
        registrar(EventoCliente.ATUALIZADO, cliente);
    }

    @Override
    public void onClienteRemovido(Cliente cliente) {
        registrar(EventoCliente.REMOVIDO, cliente);
    }

    public List<RegistroAuditoria> trilha() {
        return List.copyOf(trilha);
    }

    private void registrar(EventoCliente evento, Cliente cliente) {
        trilha.addFirst(new RegistroAuditoria(evento, cliente.getId(), cliente.getNome(), Instant.now()));
        while (trilha.size() > CAPACIDADE) {
            trilha.pollLast();
        }
    }
}
