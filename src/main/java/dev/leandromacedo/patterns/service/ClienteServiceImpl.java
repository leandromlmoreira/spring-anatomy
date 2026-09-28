package dev.leandromacedo.patterns.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.leandromacedo.patterns.model.Cep;
import dev.leandromacedo.patterns.model.Cliente;
import dev.leandromacedo.patterns.model.Endereco;
import dev.leandromacedo.patterns.observer.EventoCliente;
import dev.leandromacedo.patterns.observer.PublicadorEventosCliente;
import dev.leandromacedo.patterns.repository.ClienteRepository;
import dev.leandromacedo.patterns.repository.EnderecoRepository;
import dev.leandromacedo.patterns.repository.NotificacaoRepository;
import dev.leandromacedo.patterns.strategy.ConsultaEndereco;

@Service
@Transactional
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;
    private final EnderecoRepository enderecoRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final ConsultaEndereco consultaEndereco;
    private final PublicadorEventosCliente publicador;

    public ClienteServiceImpl(ClienteRepository clienteRepository, EnderecoRepository enderecoRepository,
            NotificacaoRepository notificacaoRepository, ConsultaEndereco consultaEndereco,
            PublicadorEventosCliente publicador) {
        this.clienteRepository = clienteRepository;
        this.enderecoRepository = enderecoRepository;
        this.notificacaoRepository = notificacaoRepository;
        this.consultaEndereco = consultaEndereco;
        this.publicador = publicador;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Cliente> buscarTodos() {
        return clienteRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Cliente buscarPorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente " + id + " não encontrado."));
    }

    @Override
    public Cliente inserir(Cliente cliente) {
        Cliente salvo = salvarComEndereco(cliente, cliente.getEndereco());
        publicador.publicar(EventoCliente.CRIADO, salvo);
        return salvo;
    }

    @Override
    public Cliente atualizar(Long id, Cliente dados) {
        Cliente existente = buscarPorId(id);
        existente.setNome(dados.getNome());
        Cliente salvo = salvarComEndereco(existente, dados.getEndereco());
        publicador.publicar(EventoCliente.ATUALIZADO, salvo);
        return salvo;
    }

    @Override
    public void remover(Long id) {
        Cliente cliente = buscarPorId(id);
        publicador.publicar(EventoCliente.REMOVIDO, cliente);
        notificacaoRepository.deleteByClienteId(id);
        clienteRepository.delete(cliente);
    }

    private Cliente salvarComEndereco(Cliente cliente, Endereco informado) {
        String cep = Cep.normalizar(informado == null ? null : informado.getCep());
        Endereco endereco = enderecoRepository.findById(cep).orElseGet(() -> consultar(cep));
        endereco.mesclar(informado);
        cliente.setEndereco(enderecoRepository.save(endereco));
        return clienteRepository.save(cliente);
    }

    private Endereco consultar(String cep) {
        return consultaEndereco.consultar(cep).orElseThrow(() -> new CepNaoEncontradoException(cep));
    }
}
