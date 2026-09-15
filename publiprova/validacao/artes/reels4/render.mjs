// Render do lote 04, quadro a quadro, sem sandbox do Higgsfield.
// Uso (dentro de validacao/artes/reels4):  node render.mjs            → todos
//                                           node render.mjs r9 r12     → só esses
//
// Por que quadro a quadro e não recordVideo: o recordVideo do Playwright grava em
// tempo real e perde quadro quando a máquina engasga, e o ffmpeg dele não tem
// libx264. Aqui cada quadro é setT(i/30) + screenshot, e o encode usa o ffmpeg
// completo do pacote imageio-ffmpeg (pip install imageio-ffmpeg).
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(path.join(aqui, "..", "..", "..", "web", "package.json"))("playwright-core");
const FFMPEG = execFileSync("python", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"], { encoding: "utf8" }).trim();
const VIDEO = path.join(aqui, "..", "video");
const FPS = 30;
const TODOS = ["r9", "r10", "r11", "r12", "r13"];
const alvo = process.argv.slice(2).length ? process.argv.slice(2) : TODOS;

const browser = await chromium.launch({ channel: "chrome" });

// O R12 usa a página real do relatório de demonstração — captura antes de montar.
if (alvo.includes("r12")) {
  const cel = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
  await cel.goto("https://publiprova-plan-b1a5.vercel.app/r/verao-hidrata-demo", { waitUntil: "networkidle", timeout: 60000 });
  await cel.screenshot({ path: path.join(aqui, "relatorio-demo.png"), fullPage: true });
  await cel.close();
  console.log("relatorio-demo.png capturado");
}

for (const id of alvo) {
  const pasta = path.join(aqui, "out", id);
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(aqui, `${id}.html`)).href);
  await page.evaluate(() => window.__pronto);
  const dur = await page.evaluate(() => window.DUR);
  const n = Math.round(dur * FPS);
  const t0 = Date.now();

  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.setT(t), i / FPS);
    await page.screenshot({ path: path.join(pasta, `f${String(i).padStart(4, "0")}.png`) });
  }
  await page.close();

  const mp4 = path.join(VIDEO, `${id}-ig.mp4`);
  // Faixa AAC muda de propósito: sem áudio, o compositor de Reels do Business Suite
  // engasga. A trilha em alta é escolhida lá, no agendamento.
  execFileSync(FFMPEG, [
    "-y", "-loglevel", "error",
    "-framerate", String(FPS), "-i", path.join(pasta, "f%04d.png"),
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-t", String(dur),
    "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "slow",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", mp4,
  ]);
  // Folha de prova (1 quadro a cada 0,5 s) e capa (o quadro 0, que é o que o feed mostra).
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", mp4, "-vf", "fps=2,scale=270:-1,tile=6x3", "-frames:v", "1", path.join(VIDEO, `prova-${id}.jpg`)]);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", path.join(pasta, "f0000.png"), "-vf", "scale=540:-1", path.join(VIDEO, `capa-${id}.jpg`)]);

  const mb = (fs.statSync(mp4).size / 1e6).toFixed(2);
  console.log(`${id}: ${n} quadros · ${dur} s · ${mb} MB · ${((Date.now() - t0) / 1000).toFixed(0)} s de render`);
}

await browser.close();
