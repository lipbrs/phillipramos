// Constantes compartilhadas das montagens dos Reels (higgsedit, sandbox do Higgsfield).
// Uso: copiar comum.mjs + editN.jsx para /home/user no sandbox, `higgsedit init reelN
// --size 1080x1920 --fps 30`, `higgsedit fonts add reelN "Inter:900" "Inter:700" "Inter:600"`,
// colocar os mp4/mp3 dentro de reelN/ e rodar `higgsedit build editN.jsx`.
// Armadilhas aprendidas em 06/09/2026: `at` dos nós é em segundos ABSOLUTOS da linha do
// tempo (somar o início do beat); `animate` dentro de column/row tem de ser lista;
// o render sai em reelN/renders/ (relativo ao projeto).
export const W = 1080, M = 80, CW = 920, BR = "#ffffff", CL = "#c7d2fe", TI = "#1e1b4b", VD = "#22c55e", RX = "#4f46e5";
export const fit = (d, span) => Math.min(d, span * 0.9);
export const fade = (dur) => [{ property: "opacity", from: 0, to: 1, duration: fit(0.4, dur), easing: "house" }];
