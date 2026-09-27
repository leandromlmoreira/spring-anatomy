package dev.leandromacedo.patterns.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.leandromacedo.patterns.adapter.CanalIndisponivelException;
import dev.leandromacedo.patterns.adapter.DespachanteNotificacao;
import dev.leandromacedo.patterns.factory.NotificacaoFactory;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.repository.NotificacaoRepository;
import dev.leandromacedo.patterns.service.ClienteService;
import dev.leandromacedo.patterns.service.RecursoNaoEncontradoException;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/notificacoes")
public class NotificacaoRestController {

    private final NotificacaoRepository notificacaoRepository;
    private final ClienteService clienteService;
    private final DespachanteNotificacao despachante;

    public NotificacaoRestController(NotificacaoRepository notificacaoRepository, ClienteService clienteService,
            DespachanteNotificacao despachante) {
        this.notificacaoRepository = notificacaoRepository;
        this.clienteService = clienteService;
        this.despachante = despachante;
    }

    @GetMapping
    public List<Notificacao> buscar(@RequestParam(required = false) Long clienteId) {
        return clienteId == null ? notificacaoRepository.findAll() : notificacaoRepository.findByClienteId(clienteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Notificacao criar(@Valid @RequestBody NovaNotificacaoRequest request) {
        Cliente cliente = clienteService.buscarPorId(request.clienteId());
        return notificacaoRepository.save(NotificacaoFactory.criar(request.tipo(), request.mensagem(), cliente));
    }

    @PostMapping("/{id}/envio")
    public Notificacao enviar(@PathVariable Long id) {
        Notificacao notificacao = notificacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Notificação " + id + " não encontrada."));
        if (!despachante.enviar(notificacao)) {
            throw new CanalIndisponivelException(notificacao.getTipo());
        }
        return notificacaoRepository.save(notificacao);
    }
}
