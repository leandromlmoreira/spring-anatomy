import { Escopo, Instancia } from '../engine/container';
import { botao, h, segmentado, substituir } from '../ui/dom';
import { acoes, demo, Ambiente } from './comum';

const BEANS = ['ClienteServiceImpl', 'DespachanteNotificacao', 'PublicadorEventosCliente'] as const;
type Bean = (typeof BEANS)[number];

export function demoSingleton({ sistema }: Ambiente): HTMLElement {
  const container = sistema.container;
  let bean: Bean = 'ClienteServiceImpl';
  const chamadas: Instancia[] = [];
  const grade = h('ol', { class: 'chamadas-bean', 'aria-live': 'polite' });
  const resumo = h('p', { class: 'resumo' });

  const renderizar = () => {
    const distintas = new Set(chamadas.map((instancia) => instancia.hash)).size;
    resumo.textContent = chamadas.length
      ? `${chamadas.length} chamadas a getBean, ${distintas} ${distintas === 1 ? 'instância distinta' : 'instâncias distintas'}.`
      : 'Nenhuma chamada ainda. O container cria o bean na primeira vez que alguém pede.';
    resumo.classList.toggle('resumo--acento', chamadas.length > 1 && distintas === 1);
    const primeira = chamadas[0]?.hash;
    substituir(
      grade,
      ...chamadas.map((instancia, indice) =>
        h(
          'li',
          { class: instancia.hash === primeira ? 'mesma' : 'outra', style: `--i:${indice}` },
          h('span', { class: 'chamadas-bean__n' }, `getBean #${indice + 1}`),
          h('code', {}, `${instancia.classe}@${instancia.hash}`),
        ),
      ),
    );
  };

  const reiniciar = () => {
    chamadas.length = 0;
    renderizar();
  };

  const seletorBean = segmentado<Bean>('Bean', BEANS.map((valor) => ({ valor, rotulo: valor })), bean, (valor) => {
    bean = valor;
    reiniciar();
  });

  const seletorEscopo = segmentado<Escopo>(
    'Escopo',
    [
      { valor: 'singleton', rotulo: '@Scope("singleton")' },
      { valor: 'prototype', rotulo: '@Scope("prototype")' },
    ],
    'singleton',
    (valor) => {
      BEANS.forEach((classe) => container.mudarEscopo(classe, valor));
      reiniciar();
    },
  );

  const pedir = (vezes: number) => {
    for (let i = 0; i < vezes; i++) chamadas.push(container.getBean(bean));
    if (chamadas.length > 12) chamadas.splice(0, chamadas.length - 12);
    renderizar();
  };

  renderizar();

  return demo(
    'Peça o mesmo bean várias vezes',
    h('div', { class: 'demo__bloco' }, h('span', { class: 'demo__rotulo' }, 'Bean'), seletorBean),
    h('div', { class: 'demo__bloco' }, h('span', { class: 'demo__rotulo' }, 'Escopo'), seletorEscopo),
    acoes(botao('context.getBean()', () => pedir(1)), botao('Pedir 4 vezes', () => pedir(4), 'secundario')),
    resumo,
    grade,
  );
}
