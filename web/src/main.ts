import './styles/base.css';
import './styles/componentes.css';
import './styles/explorador.css';
import { Sistema } from './engine/sistema';
import { montarExplorador } from './ui/explorador';
import { totalDeClasses, totalDeTestes } from './ui/fontes';
import { montarHeroi } from './ui/heroi';

function ativarCopia(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copiar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      const alvo = document.getElementById(botao.dataset.copiar ?? '');
      if (!alvo) return;
      try {
        await navigator.clipboard.writeText(alvo.textContent?.trim() ?? '');
        botao.textContent = 'Copiado';
      } catch {
        botao.textContent = 'Selecione e copie';
      }
      window.setTimeout(() => (botao.textContent = 'Copiar'), 1800);
    });
  });
}

function preencherNumeros(): void {
  const numeros: Record<string, number> = { classes: totalDeClasses(), testes: totalDeTestes() };
  document.querySelectorAll<HTMLElement>('[data-numero]').forEach((elemento) => {
    elemento.textContent = String(numeros[elemento.dataset.numero ?? ''] ?? '');
  });
}

const sistema = new Sistema();
montarHeroi(document.querySelector<HTMLElement>('[data-heroi-diagrama]') as HTMLElement);
montarExplorador(document.querySelector<HTMLElement>('#explorador') as HTMLElement, sistema);
ativarCopia();
preencherNumeros();
document.documentElement.classList.add('pronto');
