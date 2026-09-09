// R6 — "O relatório que se monta sozinho" (isca de pausa de 6 s, sem voz, 09/09/2026).
// Formato R4 do lote 02. Entradas na pasta do projeto r6/: painel.mp4, depois.mp4,
// relatorio.mp4 (as gravações de tela do Playwright convertidas para h264).
// ATENÇÃO (mudança de 09/09): p.add() resolve relativo à PASTA DO PROJETO (o `dir`),
// não ao cwd — usar nome simples ("painel.mp4"), com os arquivos dentro de r6/.
const M=80, CW=920, CL="#c7d2fe", TI="#1e1b4b", RX="#4f46e5";
const corte=[{ property:"opacity", from:0, to:1, duration:0.1, easing:"house" }];
const bloco=(t,y,a,peso=700)=>(<column x={M} y={y} width={CW} padding={22} fill="#ffffff" radius={18} animate={[{property:"opacity",keyframes:[{at:0,value:0},{at:a,value:0},{at:a+0.18,value:1}]}]}><text width={876} fontFamily="Inter" fontWeight={peso} fontSize={46} color={TI} lineHeight={1.18}>{t}</text></column>);
const topo=(l1,l2,l3)=>(<group name="texto"><text x={M} y={95} width={CW} fontFamily="Inter" fontWeight={600} fontSize={28} color={CL} letterSpacing={2}>@publiprova.app  ·  construindo em publico</text>{bloco(l1,160,0.12)}{bloco(l2,336,0.45,900)}{bloco(l3,457,0.85)}</group>);
export default async ({ project }) => {
  const p = await project({ dir: "r6", size: "1080x1920", fps: 30, background: RX });
  const painel = await p.add("painel.mp4");
  const depois = await p.add("depois.mp4");
  const rel = await p.add("relatorio.mp4");
  const tela = (f, from) => <media file={f} trimStart={from} x={20} y={880} width={1040} radius={24} animate={corte} />;
  const verde = (f, from) => <media file={f} trimStart={from} x={-40} y={370} width={1800} mask={{ shape: "rectangle", x: 80, y: 330, width: 1000, height: 700 }} radius={24} animate={corte} />;
  p.compose(<group name="g1">{tela(painel, 3)}</group>, { at: 0, dur: 2.0 });
  p.compose(<group name="g2">{verde(depois, 0.7)}</group>, { at: 2.0, dur: 1.3 });
  p.compose(<group name="g3">{tela(rel, 1)}</group>, { at: 3.3, dur: 1.4 });
  p.compose(<group name="g4">{verde(depois, 1.6)}</group>, { at: 4.7, dur: 1.3 });
  p.compose(topo("O relatório que o cliente recebe\nse monta sozinho.", "Cada entrega vira uma linha verde.", "Olha ele nascendo:"), { at: 0, dur: 6.0, name: "texto" });
  await p.render("renders/r6.mp4");
};
