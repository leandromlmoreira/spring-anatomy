package dev.leandromacedo.patterns.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import dev.leandromacedo.patterns.builder.ClienteBuilder;
import dev.leandromacedo.patterns.model.CepInvalidoException;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Endereco;
import dev.leandromacedo.patterns.observer.EventoCliente;
import dev.leandromacedo.patterns.observer.PublicadorEventosCliente;
import dev.leandromacedo.patterns.repository.ClienteRepository;
import dev.leandromacedo.patterns.repository.EnderecoRepository;
import dev.leandromacedo.patterns.repository.NotificacaoRepository;
import dev.leandromacedo.patterns.strategy.ConsultaEndereco;

class ClienteServiceImplTest {

    private final ClienteRepository clientes = mock(ClienteRepository.class);
    private final EnderecoRepository enderecos = mock(EnderecoRepository.class);
    private final NotificacaoRepository notificacoes = mock(NotificacaoRepository.class);
    private final ConsultaEndereco consulta = mock(ConsultaEndereco.class);
    private final PublicadorEventosCliente publicador = mock(PublicadorEventosCliente.class);
    private final ClienteServiceImpl service = new ClienteServiceImpl(clientes, enderecos, notificacoes, consulta,
            publicador);

    @BeforeEach
    void repositoriosDevolvemOQueSalvam() {
        when(clientes.save(any(Cliente.class))).thenAnswer(chamada -> chamada.getArgument(0));
        when(enderecos.save(any(Endereco.class))).thenAnswer(chamada -> chamada.getArgument(0));
    }

    @Test
    void consultaAEstrategiaQuandoOCepNaoEstaEmCache() {
        when(enderecos.findById("01001000")).thenReturn(Optional.empty());
        when(consulta.consultar("01001000")).thenReturn(Optional.of(pracaDaSe()));

        Cliente salvo = service.inserir(novo("Beatriz Lemos", "01001-000"));

        assertThat(salvo.getEndereco().getLogradouro()).isEqualTo("Praça da Sé");
        verify(publicador).publicar(EventoCliente.CRIADO, salvo);
    }

    @Test
    void reaproveitaOEnderecoEmCacheSemConsultarDeNovo() {
        when(enderecos.findById("01001000")).thenReturn(Optional.of(pracaDaSe()));

        service.inserir(novo("Beatriz Lemos", "01001000"));

        verify(consulta, never()).consultar(any());
    }

    @Test
    void camposDigitadosPeloUsuarioVencemOsDoViaCep() {
        when(enderecos.findById("01001000")).thenReturn(Optional.of(pracaDaSe()));
        Cliente cliente = ClienteBuilder.novoCliente().comNome("Beatriz").comCep("01001-000").comComplemento("Loja 3")
                .build();

        Cliente salvo = service.inserir(cliente);

        assertThat(salvo.getEndereco().getComplemento()).isEqualTo("Loja 3");
        assertThat(salvo.getEndereco().getLogradouro()).isEqualTo("Praça da Sé");
    }

    @Test
    void cepInexistenteInterrompeOCadastro() {
        when(enderecos.findById("99999999")).thenReturn(Optional.empty());
        when(consulta.consultar("99999999")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.inserir(novo("Beatriz", "99999-999")))
                .isInstanceOf(CepNaoEncontradoException.class);
        verify(publicador, never()).publicar(any(), any());
    }

    @Test
    void cepMalFormadoNemChegaNaEstrategia() {
        assertThatThrownBy(() -> service.inserir(novo("Beatriz", "123"))).isInstanceOf(CepInvalidoException.class);
        verify(consulta, never()).consultar(any());
    }

    @Test
    void removerAvisaOsObserversAntesDeApagar() {
        Cliente existente = novo("Beatriz", "01001000");
        existente.setId(7L);
        when(clientes.findById(7L)).thenReturn(Optional.of(existente));

        service.remover(7L);

        InOrder ordem = inOrder(publicador, notificacoes, clientes);
        ordem.verify(publicador).publicar(EventoCliente.REMOVIDO, existente);
        ordem.verify(notificacoes).deleteByClienteId(7L);
        ordem.verify(clientes).delete(existente);
    }

    @Test
    void clienteInexistenteGeraErroClaro() {
        when(clientes.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarPorId(42L))
                .isInstanceOf(RecursoNaoEncontradoException.class)
                .hasMessage("Cliente 42 não encontrado.");
    }

    private static Cliente novo(String nome, String cep) {
        return ClienteBuilder.novoCliente().comNome(nome).comCep(cep).build();
    }

    private static Endereco pracaDaSe() {
        Endereco endereco = new Endereco("01001000");
        endereco.setLogradouro("Praça da Sé");
        endereco.setBairro("Sé");
        endereco.setLocalidade("São Paulo");
        endereco.setUf("SP");
        return endereco;
    }
}
