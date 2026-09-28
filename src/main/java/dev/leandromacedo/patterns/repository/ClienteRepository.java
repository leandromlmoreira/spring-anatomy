package dev.leandromacedo.patterns.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.leandromacedo.patterns.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
