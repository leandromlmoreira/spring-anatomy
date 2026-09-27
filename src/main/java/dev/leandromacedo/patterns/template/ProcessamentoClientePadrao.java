package dev.leandromacedo.patterns.template;

import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.model.Cliente;

@Component
public class ProcessamentoClientePadrao extends ProcessamentoClienteTemplate {

    @Override
    public String plano() {
        return "padrao";
    }

    @Override
    protected void aplicarBeneficios(Cliente cliente, RelatorioProcessamento relatorio) {
        relatorio.registrar("aplicarBeneficios", "Plano padrão: nenhum benefício adicional.");
    }
}
