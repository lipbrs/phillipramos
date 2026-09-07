// R5 — "Método 48 Horas" (90 s, 07/09/2026). Formato tirado do Reel de referência
// Dagr3e9ge6F (mapa mental + método nomeado), mas sem rosto: o mapa é o produto do vídeo.
// Entradas em r5/: voz.mp3 (narração do Phillip no ElevenLabs, voz Yuri — 88,45 s),
// painel.mp4, depois.mp4, relatorio.mp4 e creator.mp4.
//
// ARMADILHA: creator.webm tem de ser cortado com `crop=540:1170:0:0` antes de virar mp4.
// O Playwright grava o viewport no canto quando deviceScaleFactor=2; sem o corte o
// "celular" aparece cinza com a tela espremida num canto.
//
// Os tempos dos beats vêm dos timestamps de palavra do whisper (faster-whisper, small):
// 4,50 WhatsApp · 5,80 planilha · 8,38 madrugada · 9,68 faria · 13,02 peças ·
// 13,58 Primeira · 24,66 Segunda · 37,70 Terceira · 43,06 marcada · 50,80 Lembrete ·
// 56,66 Quarta · 63,46 painel · 68,80 Quinta · 71,62 view · 80,08 isso · 85,88 Comenta.
import { M, CW, BR, CL, TI, VD, RX, fit, fade } from "./comum.mjs";
export default async ({ project }) => {
  const p = await project({ dir: "r5", size: "1080x1920", fps: 30, background: RX });
  const voz = await p.add("r5/voz.mp3");
  const painel = await p.add("r5/painel.mp4");
  const depois = await p.add("r5/depois.mp4");
  const cel = await p.add("r5/creator.mp4");
  const rel = await p.add("r5/relatorio.mp4");
  p.cut(voz, { at: 0, from: 0, dur: 88.45 });
  const marca = (t) => <text x={M} y={110} width={CW} fontFamily="Inter" fontWeight={600} fontSize={28} color={CL} letterSpacing={2}>{t}</text>;
  const mm = () => marca("@publiprova.app  ·  MÉTODO 48 HORAS");
  // Barra de 5 passos: dá a sensação de mapa crescendo sem ter de desenhar o mapa inteiro.
  const barra = (n) => <row x={M} y={185} width={CW} gap={14} align="center">{[1,2,3,4,5].map(i => <rect width={168} height={10} radius={5} fill={i <= n ? BR : "#6f63e8"} />)}</row>;
  const chapeu = (t, t0, d) => <text x={M} y={265} width={CW} at={t0} duration={d} fontFamily="Inter" fontWeight={700} fontSize={34} color={VD} letterSpacing={6}>{t}</text>;
  const tit = (t, size, y, t0, d, a = 0, b = null) => <text x={M} y={y} width={CW} at={t0 + a} duration={(b ?? d) - a} fontFamily="Inter" fontWeight={900} fontSize={size} color={BR} lineHeight={1.05} motion={{ by: "word", from: { y: 36, opacity: 0 }, overlap: 0.6, easing: "house", duration: fit(0.45, (b ?? d) - a) }}>{t}</text>;
  const nota = (t, y, t0, d, a = 0) => <column x={M} y={y} width={CW} padding={22} fill={TI} radius={18} at={t0 + a} duration={d - a} animate={fade(d - a)}><text width={876} fontFamily="Inter" fontWeight={700} fontSize={44} color={BR} lineHeight={1.25} align="center">{t}</text></column>;
  const tela = (f, from, y, d) => <media file={f} trimStart={from} x={20} y={y} width={1040} radius={24} animate={fade(d)} />;
  const verde = (f, from, y, d) => <media file={f} trimStart={from} x={-40} y={y - 330} width={1800} mask={{ shape: "rectangle", x: 80, y: 330, width: 1000, height: 700 }} radius={24} animate={fade(d)} />;
  const fone = (from, d) => <group name="fone" x={250} y={560} width={580} height={1060}><rect x={0} y={0} width={580} height={1060} fill="#111111" radius={56} /><media file={cel} trimStart={from} x={20} y={20} width={540} mask={{ shape: "rectangle", x: 0, y: 0, width: 540, height: 1020 }} animate={fade(d)} /></group>;
  const risco = (t, a) => <row width={CW} gap={22} padding={20} fill={TI} radius={18} align="center" animate={[{ property: "opacity", keyframes: [{ at: 0, value: 0 }, { at: a, value: 0 }, { at: a + 0.25, value: 1 }] }]}><text width={56} fontFamily="Inter" fontWeight={900} fontSize={44} color="#ff8f8f">X</text><text width={790} fontFamily="Inter" fontWeight={700} fontSize={42} color={BR}>{t}</text></row>;
  const linha = (n, t) => <row width={CW} gap={20} padding={20} fill={TI} radius={16} align="center"><text width={54} fontFamily="Inter" fontWeight={900} fontSize={44} color={VD}>{n}</text><text width={790} fontFamily="Inter" fontWeight={700} fontSize={40} color={BR}>{t}</text></row>;
  const B = [
    { at: 0.00, dur: 9.35, b: (d, t0) => <group name="b1">{marca("@publiprova.app  ·  construindo em publico")}{tit("Se eu tivesse que fechar\namanhã uma campanha\ncom 30 creators...", 82, 300, t0, d)}
      <column x={M} y={760} width={CW} gap={20} animate={fade(d)}>{risco("não pediria print no WhatsApp", 4.0)}{risco("não abriria planilha", 5.3)}{risco("não montaria o relatório de madrugada", 6.7)}</column></group> },
    { at: 9.35, dur: 4.15, b: (d, t0) => <group name="b2">{marca("@publiprova.app  ·  construindo em publico")}{tit("MÉTODO\n48 HORAS", 148, 560, t0, d)}{tit("São 5 peças.", 68, 1120, t0, d, 3.4)}</group> },
    { at: 13.50, dur: 11.10, b: (d, t0) => <group name="b3">{mm()}{barra(1)}{chapeu("PEÇA 1", t0, d)}{tit("PRAZO NO\nBRIEFING", 92, 330, t0, d)}{tela(painel, 3, 700, d)}{nota("48 horas depois do post — escrito, não combinado.", 1420, t0, d, 1.5)}</group> },
    { at: 24.60, dur: 13.05, b: (d, t0) => <group name="b4">{mm()}{barra(2)}{chapeu("PEÇA 2", t0, d)}{tit("UM LINK\nPOR CREATOR", 92, 330, t0, d)}{fone(3, d)}{tit("sem cadastro  ·  sem senha", 50, 1690, t0, d, 1.6, 11.6)}{tit("90 segundos.", 76, 1690, t0, d, 11.6)}</group> },
    { at: 37.65, dur: 18.95, b: (d, t0) => <group name="b5">{mm()}{barra(3)}{chapeu("PEÇA 3", t0, d)}{tit("A RÉGUA", 92, 330, t0, d)}{tela(painel, 14, 640, d)}{tit("D-2 · D0 · D+1 · D+3 · D+7", 58, 1360, t0, d, 5.2)}{nota("Lembrete · Motivo · Consequência — e nunca é você quem manda.", 1470, t0, d, 13.0)}</group> },
    { at: 56.60, dur: 6.80, b: (d, t0) => <group name="b6">{mm()}{barra(4)}{chapeu("PEÇA 4", t0, d)}{tit("O RELATÓRIO\nSE MONTA", 92, 330, t0, d)}{verde(depois, 1.6, 700, d)}{nota("cada entrega vira uma linha verde no painel", 1460, t0, d, 1.2)}</group> },
    { at: 63.40, dur: 5.35, b: (d, t0) => <group name="b7">{mm()}{barra(4)}{chapeu("PEÇA 4", t0, d)}{tit("O RELATÓRIO\nSE MONTA", 92, 330, t0, d)}{tela(rel, 1, 700, d)}{nota("sai pronto, com a marca da agência", 1460, t0, d, 0.8)}</group> },
    { at: 68.75, dur: 11.25, b: (d, t0) => <group name="b8">{mm()}{barra(5)}{chapeu("PEÇA 5", t0, d)}{tit("A MÉTRICA\nQUE IMPORTA", 92, 330, t0, d)}{tit("não é view.", 66, 620, t0, d, 2.5, 5.4)}
      <column x={120} y={700} width={840} padding={56} gap={12} align="center" fill={BR} radius={40} at={t0 + 5.4} duration={d - 5.4} animate={[{ property: "scale", from: 0.92, to: 1, duration: 0.5, easing: "house" }]}><text width={728} fontFamily="Inter" fontWeight={900} fontSize={62} color={RX} align="center">% ENTREGUE EM 48 H</text><text width={728} fontFamily="Inter" fontWeight={700} fontSize={46} color={RX} align="center">piso: 70%</text></column>
      {nota("abaixo disso, o problema é o combinado — não o creator.", 1180, t0, d, 8.2)}</group> },
    // b9 é o quadro que a pessoa salva: o mapa inteiro de uma vez + a palavra-chave.
    { at: 80.00, dur: 10.00, b: (d, t0) => <group name="b9">{mm()}{tit("O MÉTODO INTEIRO", 56, 225, t0, d)}
      <column x={M} y={320} width={CW} gap={16} animate={fade(d)}>{linha("1", "Prazo no briefing — 48 h")}{linha("2", "Um link por creator")}{linha("3", "A régua: D-2 · D0 · D+1 · D+3 · D+7")}{linha("4", "O relatório se monta sozinho")}{linha("5", "% entregue em 48 h — piso 70%")}</column>
      <column x={120} y={1000} width={840} padding={56} gap={8} align="center" fill={BR} radius={40} at={t0 + 5.6} duration={d - 5.6} animate={[{ property: "scale", from: 0.9, to: 1, duration: 0.5, easing: "house" }]}><text width={728} fontFamily="Inter" fontWeight={700} fontSize={38} color={RX} letterSpacing={6} align="center">COMENTE:</text><text width={728} fontFamily="Inter" fontWeight={900} fontSize={118} color={RX} align="center">RELATÓRIO</text></column>
      {tit("que eu te mando o mapa inteiro", 48, 1420, t0, d, 6.4)}</group> },
  ];
  for (const x of B) p.compose(x.b(x.dur, x.at), { at: x.at, dur: x.dur });
  await p.render("renders/r5.mp4");
};
