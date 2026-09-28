import { ClienteBuilder } from '../engine/builder';
import { Cliente } from '../engine/modelo';
import { GANCHOS, ProcessamentoClienteTemplate, RelatorioProcessamento, sobrescreve } from '../engine/template';
import { botao, campo, entrada, h, segmentado } from '../ui/dom';
import { acoes, criarSaida, demo, Ambiente } from './comum';

function clienteComNome(nome: string): Cliente {
  const cliente = new Cliente();
  cliente.nome = nome;
  return nome.trim() === '' ? cliente : ClienteBuilder.novoCliente().comNome(nome).comCep('01001-000').build();
}

function esqueleto(processamento: ProcessamentoClienteTemplate, relatorio: RelatorioProcessamento): HTMLElement {
  return h(
    'ol',
    { class: 'esqueleto-template' },
    ...GANCHOS.map((metodo) => {
      const etapa = relatorio.etapas.find((candidata) => candidata.metodo === metodo);
      const proprio = metodo !== 'validar' && sobrescreve(processamento, metodo);
      return h(
        'li',
        { class: etapa ? 'executada' : 'pulada' },
        h('code', {}, `${metodo}()`),
        h('span', { class: `etiqueta ${proprio ? 'etiqueta--acento' : ''}` }, proprio ? `sobrescrito em ${processamento.nome.replace('ProcessamentoCliente', '')}` : 'herdado do template'),
        h('span', { class: 'esqueleto-template__descricao' }, etapa ? etapa.descricao : 'não executado'),
      );
    }),
  );
}

export function demoTemplate({ sistema }: Ambiente): HTMLElement {
  let plano = 'premium';
  const nome = entrada('Helena Vasconcelos', { name: 'nome-template' });
  const saida = criarSaida('O esqueleto é o mesmo nos dois planos. Apague o nome para ver a validação interromper o fluxo.');

  const seletor = segmentado(
    'Subclasse',
    [
      { valor: 'padrao', rotulo: 'ProcessamentoClientePadrao' },
      { valor: 'premium', rotulo: 'ProcessamentoClientePremium' },
    ],
    plano,
    (valor) => {
      plano = valor;
    },
  );

  const processar = botao('processar(cliente)', () => {
    const processamento = sistema.processamentos.porNome(plano) as ProcessamentoClienteTemplate;
    const relatorio = sistema.processamentos.processar(clienteComNome(nome.value), plano);
    saida.mostrar(
      h('p', { class: `resumo ${relatorio.concluido ? '' : 'resumo--erro'}` }, relatorio.concluido ? `Plano ${relatorio.plano}: ${relatorio.etapas.length} etapas na ordem fixa.` : 'Processamento interrompido na validação.'),
      esqueleto(processamento, relatorio),
    );
    sistema.avisar();
  });

  return demo(
    'Rode o mesmo esqueleto com outra subclasse',
    h('div', { class: 'demo__bloco' }, h('span', { class: 'demo__rotulo' }, 'Subclasse'), seletor),
    campo('Nome do cliente', nome),
    acoes(processar),
    saida.elemento,
  );
}
