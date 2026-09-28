package dev.leandromacedo.patterns.template;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import dev.leandromacedo.patterns.model.Cliente;

@Service
public class CatalogoProcessamentos {

    private final Map<String, ProcessamentoClienteTemplate> porPlano;

    public CatalogoProcessamentos(List<ProcessamentoClienteTemplate> processamentos) {
        this.porPlano = processamentos.stream()
                .collect(Collectors.toMap(ProcessamentoClienteTemplate::plano, Function.identity()));
    }

    public RelatorioProcessamento processar(Cliente cliente, String plano) {
        String chave = plano == null ? "" : plano.trim().toLowerCase(Locale.ROOT);
        ProcessamentoClienteTemplate processamento = porPlano.get(chave);
        if (processamento == null) {
            throw new IllegalArgumentException("Plano desconhecido: " + plano + ". Use " + porPlano.keySet() + ".");
        }
        return processamento.processar(cliente);
    }
}
