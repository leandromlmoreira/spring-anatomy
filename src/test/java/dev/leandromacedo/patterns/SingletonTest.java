package dev.leandromacedo.patterns;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import dev.leandromacedo.patterns.adapter.DespachanteNotificacao;
import dev.leandromacedo.patterns.service.ClienteService;
import dev.leandromacedo.patterns.strategy.ConsultaEndereco;
import dev.leandromacedo.patterns.strategy.ConsultaEnderecoOffline;

@SpringBootTest(properties = "anatomy.endereco.estrategia=offline")
class SingletonTest {

    @Autowired
    private ApplicationContext contexto;

    @Test
    void oContainerDevolveSempreAMesmaInstancia() {
        ClienteService primeira = contexto.getBean(ClienteService.class);
        ClienteService segunda = contexto.getBean(ClienteService.class);

        assertThat(primeira).isSameAs(segunda);
        assertThat(contexto.getBean(DespachanteNotificacao.class)).isSameAs(contexto.getBean(DespachanteNotificacao.class));
    }

    @Test
    void aPropriedadeEscolheAEstrategiaDeEndereco() {
        assertThat(contexto.getBean(ConsultaEndereco.class)).isInstanceOf(ConsultaEnderecoOffline.class);
    }
}
