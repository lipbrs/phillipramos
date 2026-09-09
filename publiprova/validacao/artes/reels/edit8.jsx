// R8 — "O creator não é o vilão" (isca de pausa de 6 s, 09/09/2026). Repurpose dos slides
// do carrossel C06 (out/c06-*.png). Formato R4 do lote 02. Arquivos dentro de r8/
// (p.add com nome simples — ver nota em edit6.jsx).
const M=80, CW=920, CL="#c7d2fe", TI="#1e1b4b", RX="#4f46e5";
const corte=[{ property:"opacity", from:0, to:1, duration:0.1, easing:"house" }];
const bloco=(t,y,a,peso=700)=>(<column x={M} y={y} width={CW} padding={22} fill="#ffffff" radius={18} animate={[{property:"opacity",keyframes:[{at:0,value:0},{at:a,value:0},{at:a+0.18,value:1}]}]}><text width={876} fontFamily="Inter" fontWeight={peso} fontSize={46} color={TI} lineHeight={1.18}>{t}</text></column>);
const topo=(l1,l2,l3)=>(<group name="texto"><text x={M} y={95} width={CW} fontFamily="Inter" fontWeight={600} fontSize={28} color={CL} letterSpacing={2}>@publiprova.app  ·  construindo em publico</text>{bloco(l1,160,0.12)}{bloco(l2,336,0.45,900)}{bloco(l3,457,0.85)}</group>);
export default async ({ project }) => {
  const p = await project({ dir: "r8", size: "1080x1920", fps: 30, background: RX });
  const A = {};
  for (const f of ["c06-01-capa","c06-02-motivo1","c06-03-motivo2","c06-04-motivo3","c06-05-solucao","c06-06-cta"]) A[f] = await p.add(f + ".png");
  const arte = (f) => <media file={A[f]} x={40} y={620} width={1000} radius={24} animate={corte} />;
  const B = [["c06-01-capa",0,1.8],["c06-02-motivo1",1.8,0.85],["c06-03-motivo2",2.65,0.85],["c06-04-motivo3",3.5,0.85],["c06-05-solucao",4.35,0.85],["c06-06-cta",5.2,0.8]];
  for (const b of B) p.compose(<group name={"g"+b[1]}>{arte(b[0])}</group>, { at: b[1], dur: b[2] });
  p.compose(topo("O print não chega. E o creator\nnão é o vilão.", "3 motivos reais. Nenhum é preguiça.", "Olha:"), { at: 0, dur: 6.0, name: "texto" });
  await p.render("renders/r8.mp4");
};
