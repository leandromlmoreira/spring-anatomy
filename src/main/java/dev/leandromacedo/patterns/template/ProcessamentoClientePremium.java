package dev.leandromacedo.patterns.template;

import org.springframework.stereotype.Component;

import dev.leandromacedo.patterns.adapter.DespachanteNotificacao;
import dev.leandromacedo.patterns.factory.NotificacaoFactory;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Notificacao;
import dev.leandromacedo.patterns.repository.NotificacaoRepository;

@Component
public class ProcessamentoClientePremium extends ProcessamentoClienteTemplate {

    private final DespachanteNotificacao despachante;
    private final NotificacaoRepository notificacaoRepository;

    public ProcessamentoClientePremium(DespachanteNotificacao despachante, NotificacaoRepository notificacaoRepository) {
        this.despachante = despachante;
        this.notificacaoRepository = notificacaoRepository;
    }

    @Override
    public String plano() {
        return "premium";
    }

    @Override
    protected void aplicarBeneficios(Cliente cliente, RelatorioProcessamento relatorio) {
        relatorio.registrar("aplicarBeneficios", "Atendimento prioritário e frete grátis liberados.");
    }

    @Override
    protected void notificar(Cliente cliente, RelatorioProcessamento relatorio) {
        Notificacao notificacao = NotificacaoFactory.premium(cliente);
        boolean enviada = despachante.enviar(notificacao);
        notificacaoRepository.save(notificacao);
        relatorio.registrar("notificar", enviada
                ? "Aviso premium enviado por " + notificacao.getTipo() + "."
                : "Aviso premium sem canal disponível.");
    }

    @Override
    protected void registrarLog(Cliente cliente, RelatorioProcessamento relatorio) {
        relatorio.registrar("registrarLog", "Log detalhado de " + cliente.getNome() + " com trilha premium.");
    }
}
