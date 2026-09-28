package dev.leandromacedo.patterns.factory;

import java.util.Objects;

import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.model.TipoNotificacao;

public final class NotificacaoFactory {

    private NotificacaoFactory() {
    }

    public static Notificacao criar(String tipo, String mensagem, Cliente cliente) {
        return criar(TipoNotificacao.de(tipo), mensagem, cliente);
    }

    public static Notificacao criar(TipoNotificacao tipo, String mensagem, Cliente cliente) {
        if (mensagem == null || mensagem.isBlank()) {
            throw new IllegalArgumentException("A mensagem da notificação não pode ficar vazia.");
        }
        Objects.requireNonNull(cliente, "Toda notificação precisa de um cliente.");
        return new Notificacao(tipo, mensagem.trim(), cliente);
    }

    public static Notificacao boasVindas(Cliente cliente) {
        return criar(TipoNotificacao.EMAIL,
                "Bem-vindo(a), %s! Seu cadastro foi realizado com sucesso.".formatted(cliente.getNome()), cliente);
    }

    public static Notificacao atualizacao(Cliente cliente) {
        return criar(TipoNotificacao.SMS,
                "Olá, %s! Seus dados foram atualizados com sucesso.".formatted(cliente.getNome()), cliente);
    }

    public static Notificacao remocao(Cliente cliente) {
        return criar(TipoNotificacao.PUSH,
                "Olá, %s! Seu cadastro foi removido da nossa base.".formatted(cliente.getNome()), cliente);
    }

    public static Notificacao premium(Cliente cliente) {
        return criar(TipoNotificacao.EMAIL,
                "Parabéns, %s! Agora você é cliente premium e tem benefícios exclusivos.".formatted(cliente.getNome()),
                cliente);
    }
}
