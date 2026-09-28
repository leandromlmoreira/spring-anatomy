package dev.leandromacedo.patterns.template;

import dev.leandromacedo.patterns.model.Cliente;

public abstract class ProcessamentoClienteTemplate {

    public final RelatorioProcessamento processar(Cliente cliente) {
        RelatorioProcessamento relatorio = new RelatorioProcessamento(plano());
        if (!validar(cliente)) {
            return relatorio.interromper("Cliente sem nome: processamento interrompido.");
        }
        relatorio.registrar("validar", "Cliente " + cliente.getNome() + " validado.");
        aplicarBeneficios(cliente, relatorio);
        notificar(cliente, relatorio);
        registrarLog(cliente, relatorio);
        return relatorio;
    }

    public abstract String plano();

    protected abstract void aplicarBeneficios(Cliente cliente, RelatorioProcessamento relatorio);

    protected boolean validar(Cliente cliente) {
        return cliente != null && cliente.getNome() != null && !cliente.getNome().isBlank();
    }

    protected void notificar(Cliente cliente, RelatorioProcessamento relatorio) {
        relatorio.registrar("notificar", "Plano sem aviso extra.");
    }

    protected void registrarLog(Cliente cliente, RelatorioProcessamento relatorio) {
        relatorio.registrar("registrarLog", "Log resumido de " + cliente.getNome() + ".");
    }
}
