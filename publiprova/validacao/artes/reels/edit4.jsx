// R4 — "As 3 mensagens" (6 s, isca de pausa, SEM voz; a trilha entra no compositor do
// Business Suite). Formato copiado do reel de referência Db8ZdlQRdNV: três blocos de texto
// parados do primeiro ao último quadro + cortes de meio segundo no conteúdo, rápidos demais
// para ler — quem quiser, pausa. Entradas em r4/: painel.mp4, depois.mp4, msg1/2/3.png.
import { M, CW, BR, CL, TI, RX, fit, fade } from "./comum.mjs";
export default async ({ project }) => {
  const p = await project({ dir: "r4", size: "1080x1920", fps: 30, background: RX });
  const painel = await p.add("r4/painel.mp4");
  const depois = await p.add("r4/depois.mp4");
  const m1 = await p.add("r4/msg1.png");
  const m2 = await p.add("r4/msg2.png");
  const m3 = await p.add("r4/msg3.png");

  // Palco: as artes 4:5 ocupam 640..1890; os vídeos de tela (16:10) ficam centrados nessa faixa.
  const arte = (f, dur) => <media file={f} x={40} y={640} width={1000} radius={24} animate={fade(dur)} />;
  const tela = (f, from, dur) => <media file={f} trimStart={from} x={40} y={952} width={1000} radius={24} animate={fade(dur)} />;
  // Banda ampliada: recorta o retângulo (50,700,1000,560) da mídia escalada e põe no palco.
  const banda = (f, from, dur) => <media file={f} trimStart={from} x={-10} y={252} width={1600} mask={{ shape: "rectangle", x: 50, y: 700, width: 1000, height: 560 }} animate={fade(dur)} />;
  const verde = (f, from, dur) => <media file={f} trimStart={from} x={-40} y={592} width={1800} mask={{ shape: "rectangle", x: 80, y: 360, width: 1000, height: 700 }} animate={fade(dur)} />;

  const BEATS = [
    { id: "b1", at: 0.0, dur: 2.2, build: (d) => <group name="b1">{tela(painel, 3, d)}</group> },
    { id: "b2", at: 2.2, dur: 0.8, build: (d) => <group name="b2">{banda(painel, 14, d)}</group> },
    { id: "b3", at: 3.0, dur: 0.7, build: (d) => <group name="b3">{arte(m1, d)}</group> },
    { id: "b4", at: 3.7, dur: 0.7, build: (d) => <group name="b4">{arte(m2, d)}</group> },
    { id: "b5", at: 4.4, dur: 0.7, build: (d) => <group name="b5">{arte(m3, d)}</group> },
    { id: "b6", at: 5.1, dur: 0.9, build: (d) => <group name="b6">{verde(depois, 1, d)}</group> },
  ];
  for (const b of BEATS) p.compose(b.build(b.dur), { at: b.at, dur: b.dur, name: b.id });

  // Camada de texto: entra escalonada e NÃO sai mais — é ela que segura o loop.
  const bloco = (t, y, a, size = 46, peso = 700) => (
    <column x={M} y={y} width={CW} padding={22} fill="#ffffff" radius={18}
      animate={[{ property: "opacity", keyframes: [{ at: 0, value: 0 }, { at: a, value: 0 }, { at: a + 0.22, value: 1 }] }]}>
      <text width={876} fontFamily="Inter" fontWeight={peso} fontSize={size} color={TI} lineHeight={1.18}>{t}</text>
    </column>
  );
  p.compose(
    <group name="texto">
      <text x={M} y={95} width={CW} fontFamily="Inter" fontWeight={600} fontSize={28} color={CL} letterSpacing={2}>@publiprova.app  ·  construindo em público</text>
      {bloco("Programei o robô que cobra print\nde creator por mim.", 160, 0.15)}
      {bloco("30 creators. Zero mensagem manual.", 336, 0.55, 46, 900)}
      {bloco("São essas 3 mensagens:", 457, 1.0)}
    </group>,
    { at: 0, dur: 6.0, name: "texto" }
  );

  await p.render("renders/r4.mp4");
};
