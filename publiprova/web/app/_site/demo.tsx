'use client';

import { useEffect, useRef, useState } from 'react';

// Vídeo do fluxo real, no herói. É uma gravação do produto rodando com os
// dados de demonstração: a Carla aparece pendente, entrega pelo link dela, o
// painel vira 3/4 em verde e o relatório do cliente se atualiza sozinho.
//
// Autoplay silencioso e em laço, MENOS para quem pediu menos movimento no
// sistema operacional: nesse caso o pôster fica parado e aparece um botão de
// play. Isso não dá para fazer só em CSS, por isso este componente é cliente.

export function DemoFluxo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduzido, setReduzido] = useState(false);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduzido(mq.matches);
    const aoMudar = (e: MediaQueryListEvent) => setReduzido(e.matches);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduzido) {
      v.pause();
      setTocando(false);
    } else {
      // O play pode ser recusado (aba em segundo plano, política do
      // navegador). Se for, o pôster continua lá e o botão aparece.
      v.play().then(() => setTocando(true)).catch(() => setTocando(false));
    }
  }, [reduzido]);

  return (
    <div className="demo">
      <div className="moldura">
        <div className="barra"><i /><i /><i /></div>
        <video
          ref={ref}
          src="/demo-fluxo.mp4"
          poster="/demo-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Gravação do PubliProva em uso: uma creator pendente envia o link do post e o print, o painel da agência passa de 2 para 3 entregas comprovadas e o relatório do cliente se atualiza sozinho."
        />
        {!tocando && (
          <button
            type="button"
            className="demo-play"
            onClick={() => ref.current?.play().then(() => setTocando(true)).catch(() => {})}
          >
            Ver o fluxo em 15 segundos
          </button>
        )}
      </div>
      <p className="legenda">
        Gravação do produto rodando, com a campanha de demonstração. A creator entrega, o painel
        fica verde e o relatório se atualiza.
      </p>
    </div>
  );
}
