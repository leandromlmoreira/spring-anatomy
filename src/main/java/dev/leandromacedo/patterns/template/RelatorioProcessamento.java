package dev.leandromacedo.patterns.template;

import java.util.ArrayList;
import java.util.List;

public class RelatorioProcessamento {

    public record Etapa(String metodo, String descricao) {
    }

    private final String plano;
    private final List<Etapa> etapas = new ArrayList<>();
    private boolean concluido = true;

    RelatorioProcessamento(String plano) {
        this.plano = plano;
    }

    public void registrar(String metodo, String descricao) {
        etapas.add(new Etapa(metodo, descricao));
    }

    RelatorioProcessamento interromper(String motivo) {
        registrar("validar", motivo);
        concluido = false;
        return this;
    }

    public String getPlano() {
        return plano;
    }

    public List<Etapa> getEtapas() {
        return List.copyOf(etapas);
    }

    public boolean isConcluido() {
        return concluido;
    }
}
