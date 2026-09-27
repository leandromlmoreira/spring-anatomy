package dev.leandromacedo.patterns.observer;

import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.adapter.DespachanteNotificacao;
import dev.leandromacedo.patterns.factory.NotificacaoFactory;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.repository.NotificacaoRepository;

@Component
public class NotificacaoObserver implements ClienteObserver {

    private final NotificacaoRepository notificacaoRepository;
    private final DespachanteNotificacao despachante;

    public NotificacaoObserver(NotificacaoRepository notificacaoRepository, DespachanteNotificacao despachante) {
        this.notificacaoRepository = notificacaoRepository;
        this.despachante = despachante;
    }

    @Override
    public void onClienteCriado(Cliente cliente) {
        despacharERegistrar(NotificacaoFactory.boasVindas(cliente));
    }

    @Override
    public void onClienteAtualizado(Cliente cliente) {
        despacharERegistrar(NotificacaoFactory.atualizacao(cliente));
    }

    @Override
    public void onClienteRemovido(Cliente cliente) {
        despacharERegistrar(NotificacaoFactory.remocao(cliente));
    }

    private void despacharERegistrar(Notificacao notificacao) {
        despachante.enviar(notificacao);
        notificacaoRepository.save(notificacao);
    }
}
