import { ClienteBuilder } from '../engine/builder';
import { botao, campo, entrada, h, substituir } from '../ui/dom';
import { acoes, criarSaida, demo, ficha, fichaEndereco } from './comum';

const PASSOS = [
  ['comNome', 'Nome', 'Tomás Aguiar'],
  ['comCep', 'CEP', '20040-020'],
  ['comLogradouro', 'Logradouro', 'Praça Pio X'],
  ['comComplemento', 'Complemento', ''],
  ['comBairro', 'Bairro', 'Centro'],
  ['comCidade', 'Cidade', 'Rio de Janeiro'],
  ['comUf', 'UF', 'RJ'],
] as const;

type Metodo = (typeof PASSOS)[number][0];

export function demoBuilder(): HTMLElement {
  const entradas = new Map<Metodo, HTMLInputElement>(PASSOS.map(([metodo, , valor]) => [metodo, entrada(valor, { name: metodo })]));
  const previa = h('pre', { class: 'previa', 'aria-label': 'Chamada que será executada' });
  const saida = criarSaida('Preencha só o que quiser. Campos vazios ficam fora da cadeia; apague o nome para ver o build() recusar.');

  const preenchidos = () => PASSOS.filter(([metodo]) => (entradas.get(metodo)?.value ?? '').trim() !== '');

  const atualizarPrevia = () => {
    const chamadas = preenchidos().map(([metodo]) => `\n    .${metodo}("${entradas.get(metodo)?.value.trim()}")`);
    substituir(
      previa,
      h('span', { class: 'tk-tipo' }, 'ClienteBuilder'),
      '.',
      h('span', { class: 'tk-metodo' }, 'novoCliente'),
      '()',
      ...chamadas.map((chamada) => h('span', { class: 'previa__passo' }, chamada)),
      '\n    .',
      h('span', { class: 'tk-metodo' }, 'build'),
      '();',
    );
  };

  entradas.forEach((input) => input.addEventListener('input', atualizarPrevia));
  atualizarPrevia();

  const construir = botao('build()', () => {
    const builder = ClienteBuilder.novoCliente();
    preenchidos().forEach(([metodo]) => builder[metodo](entradas.get(metodo)?.value.trim()));
    try {
      const cliente = builder.build();
      saida.mostrar(ficha('Cliente', [['nome', cliente.nome]], 'build() ok'), fichaEndereco(cliente.endereco));
    } catch (erro) {
      saida.erro('IllegalStateException', (erro as Error).message);
    }
  });

  return demo(
    'Monte um cliente em passos',
    h('div', { class: 'grade-campos' }, ...PASSOS.map(([metodo, rotulo]) => campo(`${rotulo}  .${metodo}()`, entradas.get(metodo) as HTMLInputElement))),
    previa,
    acoes(construir),
    saida.elemento,
  );
}
