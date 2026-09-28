package dev.leandromacedo.patterns.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(properties = "anatomy.endereco.estrategia=offline")
@AutoConfigureMockMvc
@Transactional
class ApiIntegracaoTest {

    private static final String CLIENTE = """
            {"nome": "Marina Duarte", "cep": "01001-000", "logradouro": "Praça da Sé", "cidade": "São Paulo", "uf": "SP"}
            """;

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;

    @Test
    void cadastroPassaPelaFachadaEDisparaOsObservers() throws Exception {
        mvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.endereco.cep").value("01001000"))
                .andExpect(jsonPath("$.endereco.localidade").value("São Paulo"));

        mvc.perform(get("/notificacoes"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tipo").value("EMAIL"))
                .andExpect(jsonPath("$[0].enviada").value(true));

        mvc.perform(get("/auditoria"))
                .andExpect(jsonPath("$[0].evento").value("CRIADO"))
                .andExpect(jsonPath("$[0].cliente").value("Marina Duarte"));
    }

    @Test
    void atualizacaoGeraAvisoPorSms() throws Exception {
        long id = cadastrar();

        mvc.perform(put("/clientes/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(CLIENTE.replace("Marina Duarte", "Marina D. Souza")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Marina D. Souza"))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty());

        mvc.perform(get("/notificacoes").param("clienteId", String.valueOf(id)))
                .andExpect(jsonPath("$[1].tipo").value("SMS"));
    }

    @Test
    void notificacaoSemCanalResponde422() throws Exception {
        long id = cadastrar();
        String corpo = "{\"tipo\": \"whatsapp\", \"mensagem\": \"Oi\", \"clienteId\": " + id + "}";

        String criada = mvc.perform(post("/notificacoes").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long notificacaoId = json.readTree(criada).get("id").asLong();

        mvc.perform(post("/notificacoes/" + notificacaoId + "/envio"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value("Nenhum canal registrado para WHATSAPP."));
    }

    @Test
    void processamentoPremiumDevolveAsEtapasDoTemplate() throws Exception {
        long id = cadastrar();

        mvc.perform(post("/clientes/" + id + "/processamento").param("plano", "premium"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plano").value("premium"))
                .andExpect(jsonPath("$.etapas", hasSize(4)))
                .andExpect(jsonPath("$.etapas[2].descricao").value("Aviso premium enviado por EMAIL."));
    }

    @Test
    void validaEntradaERespondeComProblemDetail() throws Exception {
        mvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\": \"Ana\", \"cep\": \"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("O CEP precisa ter 8 dígitos."));

        mvc.perform(get("/clientes/999")).andExpect(status().isNotFound());
    }

    @Test
    void remocaoApagaClienteENotificacoes() throws Exception {
        long id = cadastrar();

        mvc.perform(delete("/clientes/" + id)).andExpect(status().isNoContent());

        mvc.perform(get("/clientes")).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/notificacoes")).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/auditoria")).andExpect(jsonPath("$[0].evento").value("REMOVIDO"));
    }

    private long cadastrar() throws Exception {
        String resposta = mvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE))
                .andReturn().getResponse().getContentAsString();
        JsonNode cliente = json.readTree(resposta);
        return cliente.get("id").asLong();
    }
}
