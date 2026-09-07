// Reel 2 — "O creator entrega em 90 segundos" (v2, 06/09/2026). Entradas em reel2/:
// r2.mp3 (narração), creator.mp4 (reel2-creator.webm com crop=540:1170:0:0 — o Playwright
// grava o viewport no canto quando deviceScaleFactor=2), depois.mp4 (reel2-painel-depois.webm).
import { W, M, CW, BR, CL, TI, VD, RX, fit, fade } from "./comum.mjs";
export default async ({ project }) => {
  const p = await project({ dir: "reel2", size: "1080x1920", fps: 30, background: RX });
  const voz = await p.add("reel2/r2.mp3"); const cel = await p.add("reel2/creator.mp4"); const dep = await p.add("reel2/depois.mp4");
  // v3 (07/09): narração refeita no ElevenLabs (voz Yuri) — 29,75 s contra 29,8 da
  // versão com a voz Andre, então os beats não precisaram ser remarcados.
  p.cut(voz, { at: 0, from: 0, dur: 29.75 });
  const marca = () => <text x={M} y={150} width={CW} fontFamily="Inter" fontWeight={600} fontSize={30} color={CL} letterSpacing={2}>@publiprova.app  ·  construindo em público</text>;
  const titulo = (t, size, y, t0, dur, a = 0, b = null) => <text x={M} y={y} width={CW} at={t0 + a} duration={(b ?? dur) - a} fontFamily="Inter" fontWeight={900} fontSize={size} color={BR} lineHeight={1.05} motion={{ by: "word", from: { y: 40, opacity: 0 }, overlap: 0.6, easing: "house", duration: fit(0.45, (b ?? dur) - a) }}>{t}</text>;
  const legenda = (t, dur) => <column x={M} y={1460} width={CW} padding={24} fill={TI} radius={20} animate={fade(dur)}><text width={872} fontFamily="Inter" fontWeight={700} fontSize={40} color={BR} align="center" lineHeight={1.25}>{t}</text></column>;
  const fone = (from, dur) => <group name="fone" x={250} y={370} width={580} height={1060}><rect x={0} y={0} width={580} height={1060} fill="#111111" radius={56} /><media file={cel} trimStart={from} x={20} y={20} width={540} mask={{ shape: "rectangle", x: 0, y: 0, width: 540, height: 1020 }} animate={fade(dur)} /></group>;
  const atrito = (t, a) => <row width={CW} gap={24} padding={22} fill={TI} radius={20} align="center" animate={[{ property: "opacity", keyframes: [{ at: 0, value: 0 }, { at: a, value: 0 }, { at: a + 0.35, value: 1 }] }]}><text width={60} fontFamily="Inter" fontWeight={900} fontSize={44} color="#ff8f8f">X</text><text width={790} fontFamily="Inter" fontWeight={700} fontSize={44} color={BR}>{t}</text></row>;
  const BEATS = [
    { id: "b1", at: 0, dur: 2.3, build: (d, t0) => <group name="b1">{marca()}{titulo("O CREATOR\nNÃO CRIA\nCONTA.", 150, 520, t0, d)}{titulo("por isso ele responde.", 56, 1150, t0, d, 0.5)}</group> },
    { id: "b2", at: 2.3, dur: 6.0, build: (d, t0) => <group name="b2">{marca()}{titulo("Por que o print\nnão chega?", 84, 300, t0, d)}
      <column x={M} y={600} width={CW} gap={22} animate={fade(d)}>{atrito("entrar num sistema", 0.7)}{atrito("criar senha", 2.2)}{atrito("achar o menu certo", 3.3)}</column>
      {titulo("é pedir demais.", 64, 1150, t0, d, 4.6)}{legenda("pedir pra alguém entrar num sistema, criar senha e achar o menu certo", d)}</group> },
    { id: "b3", at: 8.3, dur: 4.8, build: (d, t0) => <group name="b3">{marca()}{titulo("Aqui é assim:", 84, 300, t0, d)}
      <column x={M} y={560} width={CW} padding={44} fill="#0b141a" radius={32} at={t0 + 1.4} duration={d - 1.4} animate={fade(d - 1.4)}><column width={780} padding={26} fill="#202c33" radius={18}><text width={728} fontFamily="Inter" fontWeight={600} fontSize={36} color="#e9edef" lineHeight={1.3}>Oi, Diego! Falta só a comprovação da Verão Hidrata. Entrega por aqui, leva 1 minuto:</text><text width={728} fontFamily="Inter" fontWeight={700} fontSize={36} color="#53bdeb">publiprova.app/e/k7x2m</text></column></column>
      {titulo("o creator recebe um link no WhatsApp", 52, 1190, t0, d, 1.6)}{legenda("sem cadastro, sem senha, sem app", d)}</group> },
    { id: "b4", at: 13.1, dur: 7.3, build: (d, t0) => <group name="b4">{marca()}{fone(3, d)}
      {titulo("1 · cola o link do post", 48, 250, t0, d, 0, 1.6)}{titulo("2 · sobe o print dos insights", 48, 250, t0, d, 1.6, 3.5)}{titulo("3 · a IA lê os números", 48, 250, t0, d, 3.5, 5.1)}{titulo("ele só confere e envia", 48, 250, t0, d, 5.1)}
      {legenda("abre no celular, cola o link, sobe o print — a IA lê os números", d)}</group> },
    { id: "b5", at: 20.4, dur: 1.6, build: (d, t0) => <group name="b5">{marca()}{fone(15.2, d)}{titulo("90 segundos.", 96, 250, t0, d)}{legenda("noventa segundos", d)}</group> },
    { id: "b6", at: 22.0, dur: 4.9, build: (d, t0) => <group name="b6">{marca()}{titulo("Do lado da agência:\namarelo vira verde.", 76, 300, t0, d)}<media file={dep} trimStart={1} x={-40} y={200} width={1800} mask={{ shape: "rectangle", x: 80, y: 360, width: 1000, height: 700 }} animate={fade(d)} />{titulo("e a cobrança para na hora", 56, 1290, t0, d, 3.4)}{legenda("o painel muda de amarelo pra verde e a cobrança para na hora", d)}</group> },
    { id: "b7", at: 26.9, dur: 5.1, build: (d, t0) => <group name="b7">{marca()}{titulo("Se você é agência:", 64, 380, t0, d)}
      <column x={120} y={600} width={840} padding={64} gap={10} align="center" fill={BR} radius={40} animate={[{ property: "scale", from: 0.9, to: 1, duration: fit(0.5, d), easing: "house" }]}><text width={712} fontFamily="Inter" fontWeight={700} fontSize={40} color={RX} letterSpacing={6} align="center">COMENTE:</text><text width={712} fontFamily="Inter" fontWeight={900} fontSize={150} color={RX} align="center">PRINT</text></column>
      {titulo("que eu te mostro por dentro", 60, 1180, t0, d, 1.0)}{legenda("@publiprova.app  ·  construindo em público", d)}</group> },
  ];
  for (const b of BEATS) p.compose(b.build(b.dur, b.at), { at: b.at, dur: b.dur, name: b.id });
  await p.render("renders/reel2.mp4");
};
