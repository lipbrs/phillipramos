// Renderiza todos os .frame de um HTML de artes em PNG (out/<data-nome>.png).
// Uso: node render-lote.mjs carrosseis-lote-02.html
// Diferente do render.mjs, não captura o app — usa os prints já existentes na pasta.
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const arquivo = process.argv[2];
if (!arquivo) { console.error('uso: node render-lote.mjs <arquivo.html>'); process.exit(1); }

const { chromium } = createRequire(path.join(aqui, '..', '..', 'web', 'package.json'))('playwright-core');
const saida = path.join(aqui, 'out');
fs.mkdirSync(saida, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await page.goto('file://' + path.join(aqui, arquivo));
await page.waitForLoadState('networkidle');
for (const frame of await page.locator('.frame').all()) {
  const nome = await frame.getAttribute('data-nome');
  await frame.scrollIntoViewIfNeeded();
  await frame.screenshot({ path: path.join(saida, nome + '.png') });
  console.log('ok:', nome + '.png');
}
await browser.close();
