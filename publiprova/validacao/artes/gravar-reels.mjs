// Grava a tela REAL do app para os Reels do piloto 01 (painel e fluxo do creator).
// Uso: node gravar-reels.mjs            (na pasta validacao/artes, app em localhost:3000
//      em modo demonstração — reinicie o servidor entre execuções: o estado é em memória)
// Saída: video/reel1-painel.webm (1280x800), video/reel1-relatorio.webm,
//        video/reel2-creator.webm (1080x2340, layout de celular)
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(aqui, '..', '..', 'web');
const { chromium } = createRequire(path.join(web, 'package.json'))('playwright-core');
const BASE = 'http://localhost:3000';
const PRINT = path.join(web, 'e2e', 'print-exemplo.png');
const saida = path.join(aqui, 'video');
fs.mkdirSync(saida, { recursive: true });

const tiraBadgeDev = (p) => p.evaluate(() => {
  document.querySelectorAll('nextjs-portal, [data-nextjs-toast], [data-next-badge], [data-nextjs-dev-tools-button]')
    .forEach((e) => e.remove());
});
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// Guarda o vídeo da página com nome fixo (o Playwright grava com nome aleatório).
async function fecharEGuardar(ctx, page, nome) {
  const v = page.video();
  await ctx.close();
  const tmp = await v.path();
  const destino = path.join(saida, nome);
  fs.copyFileSync(tmp, destino);
  fs.unlinkSync(tmp);
  console.log('ok:', nome);
}

// Entrega de um creator pelo link mágico (usada nas duas gravações).
async function entregar(page, token, devagar = false) {
  const d = devagar ? { delay: 45 } : {};
  await page.goto(`${BASE}/e/${token}`, { waitUntil: 'networkidle' });
  await tiraBadgeDev(page);
  if (devagar) await pausa(2500);
  await page.click('#postUrl');
  await page.type('#postUrl', 'https://www.instagram.com/reel/CtVeraoHidrata/', d);
  if (devagar) await pausa(1200);
  await page.setInputFiles('#screenshot', PRINT);
  await pausa(devagar ? 2500 : 800);
  for (const [id, val] of [['#reach', '18400'], ['#impressions', '23100'], ['#likes', '1120'],
                           ['#saves', '260'], ['#shares', '95'], ['#linkClicks', '310']]) {
    await page.click(id);
    await page.type(id, val, devagar ? { delay: 60 } : {});
    if (devagar) await pausa(250);
  }
  if (devagar) await pausa(1500);
  await Promise.all([
    page.waitForURL(/\/e\/.*ok=1/, { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  await tiraBadgeDev(page);
  if (devagar) await pausa(3500);
}

const browser = await chromium.launch({ channel: 'chrome' });

// ---------- Reel 1: painel (desktop) ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    recordVideo: { dir: saida, size: { width: 1280, height: 800 } },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Entrar na conta de demonstração")');
  await page.waitForURL(/\/app$/);
  await page.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
  await tiraBadgeDev(page);
  await pausa(4000); // painel 2/4, linhas pendentes

  // um creator entrega numa aba escondida (mesma sessão não é necessária: link público)
  const waHref = await page.locator('a:has-text("WhatsApp")').first().getAttribute('href');
  const tokens = [...decodeURIComponent(waHref).matchAll(/\/e\/([a-z0-9]+)/g)].map((m) => m[1]);
  const oculta = await browser.newPage();
  await entregar(oculta, tokens[0]);
  await oculta.close();

  await page.reload({ waitUntil: 'networkidle' });
  await tiraBadgeDev(page);
  await pausa(4500); // 3/4: linha virou COMPROVADO
  const copiar = page.locator('button:has-text("opiar"), a:has-text("elatório")').first();
  if (await copiar.count()) { await copiar.hover(); await pausa(2500); }
  await fecharEGuardar(ctx, page, 'reel1-painel.webm');
}

// ---------- Reel 1: relatório do cliente ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    recordVideo: { dir: saida, size: { width: 1280, height: 800 } },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/r/verao-hidrata-demo`, { waitUntil: 'networkidle' });
  await tiraBadgeDev(page);
  await pausa(2500);
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 60); await pausa(220); }
  await pausa(2000);
  await fecharEGuardar(ctx, page, 'reel1-relatorio.webm');
}

// ---------- Reel 2: creator no celular ----------
{
  // pega o token do segundo pendente
  const p0 = await browser.newPage();
  await p0.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await p0.click('button:has-text("Entrar na conta de demonstração")');
  await p0.waitForURL(/\/app$/);
  await p0.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
  const hrefs = await p0.locator('a:has-text("WhatsApp")').evaluateAll((as) => as.map((a) => a.href));
  const token = hrefs.map((h) => decodeURIComponent(h).match(/\/e\/([a-z0-9]+)/)?.[1]).filter(Boolean)[0];
  await p0.close();

  const ctx = await browser.newContext({
    viewport: { width: 540, height: 1170 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    recordVideo: { dir: saida, size: { width: 1080, height: 2340 } },
  });
  const page = await ctx.newPage();
  await entregar(page, token, true);
  await fecharEGuardar(ctx, page, 'reel2-creator.webm');

  // e o painel depois da entrega, em desktop, para o corte "ficou verde"
  const ctx2 = await browser.newContext({
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    recordVideo: { dir: saida, size: { width: 1280, height: 800 } },
  });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await p2.click('button:has-text("Entrar na conta de demonstração")');
  await p2.waitForURL(/\/app$/);
  await p2.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
  await tiraBadgeDev(p2);
  await pausa(4000);
  await fecharEGuardar(ctx2, p2, 'reel2-painel-depois.webm');
}

await browser.close();
