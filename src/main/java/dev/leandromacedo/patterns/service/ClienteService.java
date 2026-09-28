package dev.leandromacedo.patterns.service;

import java.util.List;

import dev.leandromacedo.patterns.model.Cliente;

public interface ClienteService {

    List<Cliente> buscarTodos();

    Cliente buscarPorId(Long id);

    Cliente inserir(Cliente cliente);

    Cliente atualizar(Long id, Cliente dados);

    void remover(Long id);
}
