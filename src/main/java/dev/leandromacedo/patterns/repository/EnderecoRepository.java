package dev.leandromacedo.patterns.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.leandromacedo.patterns.model.Endereco;

public interface EnderecoRepository extends JpaRepository<Endereco, String> {
}
