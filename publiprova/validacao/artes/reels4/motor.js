// Motor de tempo do lote 04. Cada Reel define window.DUR e window.setT(t).
// O render chama setT(i/30) e fotografa — sem animação CSS, sem relógio real:
// o quadro N sai igual toda vez, e o quadro 0 já tem o gancho inteiro na tela.
window.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
window.prog = (t, ini, dur) => clamp((t - ini) / dur);
window.eo = (p) => 1 - Math.pow(1 - p, 3);
window.eio = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// Entra de baixo com fade. Antes de `ini` fica invisível.
window.entra = (el, t, ini, dur = 0.26, dist = 16) => {
  const p = eo(prog(t, ini, dur));
  el.style.opacity = p;
  el.style.transform = `translateY(${(1 - p) * dist}px) scale(${0.97 + 0.03 * p})`;
};

// Visível só dentro da janela [ini, fim), com fade curto nas bordas.
window.janela = (el, t, ini, fim, fade = 0.07) => {
  const p = Math.min(prog(t, ini, fade), 1 - prog(t, fim - fade, fade));
  el.style.opacity = clamp(p);
};

// O render espera isto antes do primeiro quadro: fontes carregadas e imagens prontas.
window.__pronto = (async () => {
  await Promise.all(["400", "500", "600", "700", "800", "900"].map((w) => document.fonts.load(`${w} 20px Inter`)));
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
  return true;
})();
