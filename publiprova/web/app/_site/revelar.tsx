'use client';

import { useEffect } from 'react';

// Motor das revelações no scroll.
//
// Por que não é CSS puro com animation-timeline: view():
// 1. Animação presa à timeline do scroll fica refém da VELOCIDADE de rolagem.
//    Quem rola devagar vê a animação em câmera lenta, o que parece defeito.
//    Aqui o gatilho é a posição, e a duração é fixa.
// 2. E principalmente: com animation-timeline, elemento fora da faixa fica preso
//    no primeiro quadro. Com opacity: 0 isso deixa a seção INVISÍVEL de verdade,
//    não só no screenshot. Já aconteceu aqui e derrubou duas seções do /produto.
//
// A garantia contra aquilo agora é estrutural: o estado inicial escondido só
// existe quando o <html> ganha data-anima="pronto", e isso só acontece depois
// que este componente montou E o IntersectionObserver existe. Sem JS, JS
// quebrado, navegador antigo ou robô de busca: tudo visível, sempre.

export function Revelar() {
  useEffect(() => {
    const raiz = document.documentElement;
    const alvos = Array.from(document.querySelectorAll<HTMLElement>('.revela'));

    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (semMovimento || !('IntersectionObserver' in window) || alvos.length === 0) {
      return; // nada de data-anima: o CSS nunca esconde nada
    }

    raiz.dataset.anima = 'pronto';

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.visivel = 'sim';
          obs.unobserve(e.target); // revela uma vez; não pisca no scroll de volta
        }
      },
      // 12% do elemento basta: dispara antes de estar no meio da tela, então a
      // animação termina enquanto o olho ainda está chegando nela.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    alvos.forEach((el) => obs.observe(el));

    // Rede de segurança: se algo der errado e um alvo continuar escondido depois
    // de 3 segundos, o estado inicial é removido da página inteira.
    const rede = window.setTimeout(() => {
      const preso = alvos.some((el) => !el.dataset.visivel && el.getBoundingClientRect().top < window.innerHeight);
      if (preso) delete raiz.dataset.anima;
    }, 3000);

    return () => {
      obs.disconnect();
      window.clearTimeout(rede);
      delete raiz.dataset.anima;
    };
  }, []);

  return null;
}
