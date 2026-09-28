import { criarDiagrama } from './diagrama';
import { movimentoReduzido } from './dom';
import { DIAGRAMA_GERAL, ROTEIRO_GERAL } from './padroes';

const PASSO_MS = 430;
const PAUSA_MS = 2200;

export function montarHeroi(figura: HTMLElement): void {
  const diagrama = criarDiagrama(
    DIAGRAMA_GERAL,
    'Mapa da API: um POST /clientes passa pelo controller, pelo builder, pelo serviço, pela estratégia de endereço e pelos observers até o despachante de notificações. Cada rótulo leva ao padrão correspondente.',
  );
  diagrama.elemento.classList.add('diagrama--heroi');
  figura.prepend(diagrama.elemento);
  if (movimentoReduzido()) return;

  let passo = 0;
  let visivel = false;
  let temporizador: number | undefined;

  const avancar = () => {
    temporizador = undefined;
    if (!visivel || document.hidden) return;
    diagrama.pulsar(ROTEIRO_GERAL[passo]);
    passo = (passo + 1) % ROTEIRO_GERAL.length;
    if (passo === 0) diagrama.repousar();
    temporizador = window.setTimeout(avancar, passo === 0 ? PAUSA_MS : PASSO_MS);
  };

  const retomar = () => {
    if (visivel && !document.hidden && temporizador === undefined) {
      temporizador = window.setTimeout(avancar, 900);
    }
  };

  new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting;
    retomar();
  }).observe(figura);
  document.addEventListener('visibilitychange', retomar);
}
