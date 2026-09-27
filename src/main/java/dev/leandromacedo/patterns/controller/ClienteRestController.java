package dev.leandromacedo.patterns.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.service.ClienteService;
import dev.leandromacedo.patterns.template.CatalogoProcessamentos;
import dev.leandromacedo.patterns.template.RelatorioProcessamento;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/clientes")
public class ClienteRestController {

    private final ClienteService clienteService;
    private final CatalogoProcessamentos processamentos;

    public ClienteRestController(ClienteService clienteService, CatalogoProcessamentos processamentos) {
        this.clienteService = clienteService;
        this.processamentos = processamentos;
    }

    @GetMapping
    public List<Cliente> buscarTodos() {
        return clienteService.buscarTodos();
    }

    @GetMapping("/{id}")
    public Cliente buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cliente inserir(@Valid @RequestBody ClienteRequest request) {
        return clienteService.inserir(request.paraCliente());
    }

    @PutMapping("/{id}")
    public Cliente atualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest request) {
        return clienteService.atualizar(id, request.paraCliente());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        clienteService.remover(id);
    }

    @PostMapping("/{id}/processamento")
    public RelatorioProcessamento processar(@PathVariable Long id,
            @RequestParam(defaultValue = "premium") String plano) {
        return processamentos.processar(clienteService.buscarPorId(id), plano);
    }
}
