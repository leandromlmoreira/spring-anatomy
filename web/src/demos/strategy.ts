import { normalizarCep } from '../engine/modelo';
import { NomeEstrategia } from '../engine/strategy';
import { aguardarBotao, botao, campo, entrada, h, segmentado } from '../ui/dom';
import { acoes, atalhosDeCep, criarSaida, demo, fichaEndereco, mascararCep, Ambiente } from './comum';
import { tituloDoErro } from './facade';

const CLASSES: Record<NomeEstrategia, string> = {
  viacep: 'ViaCepConsultaEndereco',
  offline: 'ConsultaEnderecoOffline',
};

export function demoStrategy({ sistema }: Ambiente): HTMLElement {
  const cep = mascararCep(entrada('30130-010', { name: 'cep-estrategia' }));
  const propriedade = h('code', { class: 'propriedade' });
  const saida = criarSaida('Escolha a estratégia e consulte. O serviço chama a mesma interface nos dois casos.');
  const mostrarPropriedade = () => {
    propriedade.textContent = `anatomy.endereco.estrategia=${sistema.estrategia}`;
  };
  mostrarPropriedade();

  const seletor = segmentado<NomeEstrategia>(
    'Implementação de ConsultaEndereco',
    [
      { valor: 'viacep', rotulo: 'ViaCepConsultaEndereco' },
      { valor: 'offline', rotulo: 'ConsultaEnderecoOffline' },
    ],
    sistema.estrategia,
    (valor) => {
      sistema.usarEstrategia(valor);
      mostrarPropriedade();
      saida.dica(`Agora o Spring injetaria ${CLASSES[valor]}. Consulte de novo e compare.`);
    },
  );

  const consultar = botao('consultar(cep)', () =>
    aguardarBotao(consultar, async () => {
      saida.carregando(`Chamando ${CLASSES[sistema.estrategia]}...`);
      try {
        const normalizado = normalizarCep(cep.value);
        const endereco = await sistema.clienteService['consultar'](normalizado);
        saida.mostrar(fichaEndereco(endereco, `Endereco via ${CLASSES[sistema.estrategia]}`));
      } catch (erro) {
        saida.erro(tituloDoErro(erro), (erro as Error).message);
      }
    }),
  );

  return demo(
    'Troque a estratégia em tempo real',
    h('div', { class: 'demo__bloco' }, h('span', { class: 'demo__rotulo' }, 'Implementação injetada'), seletor, propriedade),
    campo('CEP', cep),
    atalhosDeCep(cep),
    acoes(consultar),
    saida.elemento,
  );
}
