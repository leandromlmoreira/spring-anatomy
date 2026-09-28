package dev.leandromacedo.patterns.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.leandromacedo.patterns.model.Notificacao;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    List<Notificacao> findByClienteId(Long clienteId);

    void deleteByClienteId(Long clienteId);
}
