package dev.leandromacedo.patterns.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String mensagem;
    @Enumerated(EnumType.STRING)
    private TipoNotificacao tipo;
    private LocalDateTime criadaEm;
    private boolean enviada;
    @ManyToOne
    private Cliente cliente;

    protected Notificacao() {
    }

    public Notificacao(TipoNotificacao tipo, String mensagem, Cliente cliente) {
        this.tipo = tipo;
        this.mensagem = mensagem;
        this.cliente = cliente;
        this.criadaEm = LocalDateTime.now();
    }

    public void marcarComoEnviada() {
        enviada = true;
    }

    public Long getId() {
        return id;
    }

    public String getMensagem() {
        return mensagem;
    }

    public TipoNotificacao getTipo() {
        return tipo;
    }

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }

    public boolean isEnviada() {
        return enviada;
    }

    public Cliente getCliente() {
        return cliente;
    }
}
