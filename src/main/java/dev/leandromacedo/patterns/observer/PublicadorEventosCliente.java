package dev.leandromacedo.patterns.observer;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.model.Cliente;

@Component
public class PublicadorEventosCliente {

    private static final Logger log = LoggerFactory.getLogger(PublicadorEventosCliente.class);

    private final List<ClienteObserver> observers;

    public PublicadorEventosCliente(List<ClienteObserver> observers) {
        this.observers = observers;
    }

    public void publicar(EventoCliente evento, Cliente cliente) {
        observers.forEach(observer -> entregar(evento, observer, cliente));
    }

    private void entregar(EventoCliente evento, ClienteObserver observer, Cliente cliente) {
        try {
            evento.entregar(observer, cliente);
        } catch (RuntimeException falha) {
            log.warn("{} falhou ao receber {}: {}", observer.getClass().getSimpleName(), evento, falha.getMessage());
        }
    }
}
