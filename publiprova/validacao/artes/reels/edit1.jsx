// Reel 1 — "O relatório que se monta sozinho" (v3, 06/09/2026). Entradas em reel1/:
// r1.mp3 (narração ElevenLabs/Andre), painel.mp4 (gravar-reels.mjs → reel1-painel.webm em h264),
// relatorio.mp4 (reel1-relatorio.webm em h264). Cortes casados com os tempos das palavras (whisper).
import { W, M, CW, BR, CL, TI, VD, RX, fit, fade } from "./comum.mjs";
export default async ({ project }) => {
  const p = await project({ dir: "reel1", size: "1080x1920", fps: 30, background: RX });
  const voz = await p.add("reel1/r1.mp3"); const painel = await p.add("reel1/painel.mp4"); const rel = await p.add("reel1/relatorio.mp4");
  p.cut(voz, { at: 0, from: 0, dur: 31.9 });
  const marca = () => <text x={M} y={150} width={CW} fontFamily="Inter" fontWeight={600} fontSize={30} color={CL} letterSpacing={2}>@publiprova.app  ·  construindo em público</text>;
  const titulo = (t, size, y, t0, dur, a = 0) => <text x={M} y={y} width={CW} at={t0 + a} duration={dur - a} fontFamily="Inter" fontWeight={900} fontSize={size} color={BR} lineHeight={1.05} motion={{ by: "word", from: { y: 40, opacity: 0 }, overlap: 0.6, easing: "house", duration: fit(0.5, dur - a) }}>{t}</text>;
  const legenda = (t, dur) => <column x={M} y={1430} width={CW} padding={24} fill={TI} radius={20} animate={fade(dur)}><text width={872} fontFamily="Inter" fontWeight={700} fontSize={40} color={BR} align="center" lineHeight={1.25}>{t}</text></column>;
  const janela = (file, from, x, y, dur) => <media file={file} trimStart={from} x={x} y={y} width={1000} radius={24} animate={fade(dur)} />;
  const zoom = (file, from, mw, mx, my, mh, dur) => <media file={file} trimStart={from} x={mx} y={my} width={mw} mask={{ shape: "rectangle", x: 40 - mx, y: 560 - my, width: 1000, height: mh }} animate={fade(dur)} />;
  const bolha = (t, a, b) => <column width={780} padding={26} fill="#005c4b" radius={18} animate={[{ property: "opacity", keyframes: [{ at: 0, value: 0 }, { at: a, value: 0 }, { at: b, value: 1 }] }]}><text width={728} fontFamily="Inter" fontWeight={600} fontSize={36} color="#e9edef" lineHeight={1.3}>{t}</text></column>;
  const BEATS = [
    { id: "b1", at: 0, dur: 3.1, build: (d, t0) => <group name="b1">{marca()}{titulo("SUA AGÊNCIA\nAINDA COBRA\nPRINT NO\nWHATSAPP?", 132, 560, t0, d)}</group> },
    { id: "b2", at: 3.1, dur: 4.8, build: (d, t0) => <group name="b2">{marca()}{titulo("30 creators.\n30 cobranças.", 84, 300, t0, d)}
      <column x={M} y={580} width={CW} padding={44} gap={26} fill="#0b141a" radius={32} animate={fade(d)}>{bolha("Oi! Consegue me mandar o link do post?", 0.1, 0.5)}{bolha("Oi de novo! E o print dos stories?", 1.4, 1.8)}{bolha("Amigo, o cliente pede o relatório amanhã...", 2.8, 3.2)}</column>
      {legenda("alguém da agência cobrando link e print de 30 pessoas no WhatsApp", d)}</group> },
    { id: "b3", at: 7.9, dur: 5.9, build: (d, t0) => <group name="b3">{marca()}{titulo("Cada creator\nrecebe um link.", 84, 300, t0, d)}{janela(painel, 3, 40, 560, d)}{titulo("sem cadastro  ·  sem senha", 52, 1250, t0, d, 3.7)}{legenda("olha o que a gente está construindo", d)}</group> },
    { id: "b4", at: 13.8, dur: 5.8, build: (d, t0) => <group name="b4">{marca()}{titulo("Ele cola o post,\nsobe o print...", 76, 300, t0, d)}{zoom(painel, 13, 1800, -40, 200, 700, d)}
      <rect x={40} y={928} width={1000} height={84} fill={VD} strokeWidth={6} strokeColor={VD} radius={12} at={t0 + 4.0} duration={d - 4.0} animate={[{ property: "opacity", from: 0, to: 0.22, duration: fit(0.3, d - 4.0), easing: "house" }]} />
      {titulo("a linha fica verde sozinha", 56, 1290, t0, d, 4.0)}{legenda("e aqui no painel a linha dele fica verde sozinha", d)}</group> },
    { id: "b5", at: 19.6, dur: 3.8, build: (d, t0) => <group name="b5">{marca()}{titulo("Quem não entregou\né cobrado todo dia.", 76, 300, t0, d)}{zoom(painel, 14, 1600, -10, -140, 560, d)}{titulo("D-2  ·  D0  ·  D+1  ·  D+3  ·  D+7", 52, 1180, t0, d, 1.2)}{legenda("cobrado todo dia, automaticamente", d)}</group> },
    { id: "b6", at: 23.4, dur: 3.7, build: (d, t0) => <group name="b6">{marca()}{titulo("O relatório do cliente\nsai pronto.", 76, 300, t0, d)}{janela(rel, 1, 40, 560, d)}{legenda("com a marca da agência", d)}</group> },
    { id: "b7", at: 27.1, dur: 3.1, build: (d, t0) => <group name="b7">{marca()}{titulo("Estamos ouvindo\n15 agências\nantes de abrir.", 110, 560, t0, d)}{legenda("sem pitch: 6 perguntas, por mensagem, no seu tempo", d)}</group> },
    { id: "b8", at: 30.2, dur: 3.8, build: (d, t0) => <group name="b8">{marca()}
      <column x={120} y={560} width={840} padding={64} gap={10} align="center" fill={BR} radius={40} animate={[{ property: "scale", from: 0.9, to: 1, duration: fit(0.5, d), easing: "house" }]}><text width={712} fontFamily="Inter" fontWeight={700} fontSize={40} color={RX} letterSpacing={6} align="center">COMENTE:</text><text width={712} fontFamily="Inter" fontWeight={900} fontSize={128} color={RX} align="center">RELATÓRIO</text></column>
      {titulo("que eu te mostro por dentro", 60, 1180, t0, d, 0.3)}{legenda("@publiprova.app  ·  construindo em público", d)}</group> },
  ];
  for (const b of BEATS) p.compose(b.build(b.dur, b.at), { at: b.at, dur: b.dur, name: b.id });
  await p.render("renders/reel1.mp4");
};
