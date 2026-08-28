/**
 * Teste de ponta a ponta do fluxo que é o produto:
 * agência vê pendências → creator envia pelo link mágico → painel e relatório
 * atualizam → a régua para de cobrar quem entregou.
 *
 *   npm run build && npm start          (num terminal)
 *   npm i -D playwright-core && node e2e/fluxo-completo.mjs
 *
 * Roda contra o modo demonstração (dados em memória) — reinicie o servidor
 * entre execuções, porque o teste altera o estado da campanha de exemplo.
 */
import { chromium } from 'playwright-core';

const EXE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
let failures = 0;
const ok = (label, cond, extra = '') => {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FALHOU'}  ${label}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// 1. painel: pega o link mágico da Carla (pendente)
await page.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
const before = await page.locator('.stat-value').first().innerText();
ok('painel mostra 2/4 comprovados', before.trim() === '2/4', before.trim());

const waHref = await page.locator('a:has-text("WhatsApp")').first().getAttribute('href');
ok('botão WhatsApp gera wa.me com o link do creator',
   !!waHref && waHref.startsWith('https://wa.me/55') && decodeURIComponent(waHref).includes('/e/'));

const token = decodeURIComponent(waHref).match(/\/e\/([a-z0-9]+)/)[1];

// 2. creator abre o link e envia a comprovação
await page.goto(`${BASE}/e/${token}`, { waitUntil: 'networkidle' });
ok('página do creator abre sem login', await page.locator('h1').innerText().then(t => t.includes('Oi,')));

await page.fill('#postUrl', 'https://www.instagram.com/reel/CtEsteEhOTeste/');
await page.fill('#reach', '18400');
await page.fill('#impressions', '23100');
await page.fill('#likes', '1120');
await page.fill('#saves', '260');
await page.fill('#shares', '95');
await page.fill('#linkClicks', '310');
await Promise.all([
  page.waitForURL(/\/e\/.*ok=1/, { timeout: 20000 }),
  page.click('button[type=submit]'),
]);
ok('envio registrado', (await page.locator('h1').innerText()).includes('Entrega registrada'));

// 3. reenvio pelo mesmo link não duplica: mostra estado "já entregue"
await page.goto(`${BASE}/e/${token}`, { waitUntil: 'networkidle' });
ok('link vira comprovante depois do envio',
   (await page.locator('h1').innerText()).includes('Entrega registrada'));

// 4. painel atualizado
await page.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
const after = await page.locator('.stat-value').first().innerText();
ok('painel atualiza para 3/4', after.trim() === '3/4', after.trim());

// 5. relatório do cliente consolida o novo creator
await page.goto(`${BASE}/r/verao-hidrata-demo`, { waitUntil: 'networkidle' });
const cards = await page.locator('article.card').count();
ok('relatório mostra 3 creators comprovados', cards === 3, `${cards} cards`);
const cpm = await page.locator('.stat', { hasText: 'CPM' }).first().locator('.stat-value').innerText();
ok('CPM calculado no relatório', /R\$/.test(cpm), cpm);

// 6. cobrança automática para de perseguir quem entregou
const run = await (await fetch(`${BASE}/api/cron/nudges`)).json();
ok('régua não cobra quem já entregou', !JSON.stringify(run.sent).includes('Carla'), JSON.stringify(run.sent));

await browser.close();
process.exit(failures === 0 ? 0 : 1);
