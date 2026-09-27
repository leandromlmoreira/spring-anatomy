package dev.leandromacedo.patterns.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.leandromacedo.patterns.observer.AuditoriaObserver;
import dev.leandromacedo.patterns.observer.RegistroAuditoria;

@RestController
@RequestMapping("/auditoria")
public class AuditoriaRestController {

    private final AuditoriaObserver auditoria;

    public AuditoriaRestController(AuditoriaObserver auditoria) {
        this.auditoria = auditoria;
    }

    @GetMapping
    public List<RegistroAuditoria> trilha() {
        return auditoria.trilha();
    }
}
