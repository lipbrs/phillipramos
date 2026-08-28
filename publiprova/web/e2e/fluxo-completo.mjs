/**
 * Teste de ponta a ponta do fluxo que é o produto — agora multi-tenant:
 * login sem senha → campanha → creator envia pelo link mágico (com o print
 * persistido) → painel e relatório atualizam → limites de plano barram na
 * criação → uma agência não enxerga a campanha da outra.
 *
 *   npm run build && npm start          (num terminal)
 *   npm i -D playwright-core && node e2e/fluxo-completo.mjs
 *
 * Roda contra o modo demonstração (dados em memória) — reinicie o servidor
 * entre execuções, porque o teste altera o estado da campanha de exemplo.
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EXE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const PRINT = join(dirname(fileURLToPath(import.meta.url)), 'print-exemplo.png');

let failures = 0;
const ok = (label, cond, extra = '') => {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FALHOU'}  ${label}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// 0. painel exige sessão
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
ok('sem sessão, /app redireciona para /login', page.url().includes('/login'));

// 1. login de demonstração
await Promise.all([
  page.waitForURL(/\/app$/, { timeout: 15000 }),
  page.click('button:has-text("Entrar na conta de demonstração")'),
]);
ok('login de demonstração entra no painel', await page.locator('h1').innerText().then((t) => t.includes('Suas campanhas')));
ok('painel mostra o plano e o uso do mês', await page.locator('.badge', { hasText: 'creators no mês' }).count() === 1);

// 2. campanha de exemplo: pega o link mágico de um pendente
await page.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
const before = await page.locator('.stat-value').first().innerText();
ok('campanha mostra 2/4 comprovados', before.trim() === '2/4', before.trim());

const waHref = await page.locator('a:has-text("WhatsApp")').first().getAttribute('href');
ok('botão WhatsApp gera wa.me com o link do creator',
   !!waHref && waHref.startsWith('https://wa.me/55') && decodeURIComponent(waHref).includes('/e/'));
const token = decodeURIComponent(waHref).match(/\/e\/([a-z0-9]+)/)[1];

// 3. creator envia comprovação com o print anexado (sem login)
await page.goto(`${BASE}/e/${token}`, { waitUntil: 'networkidle' });
ok('página do creator abre sem login', await page.locator('h1').innerText().then((t) => t.includes('Oi,')));

await page.fill('#postUrl', 'https://www.instagram.com/reel/CtEsteEhOTeste/');
await page.setInputFiles('#screenshot', PRINT);
await page.waitForTimeout(800); // /api/extract responde (sem chave de IA, cai no manual)
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

const printLink = await page.locator('a:has-text("ver o print enviado")').getAttribute('href');
ok('confirmação linka o print guardado', !!printLink && printLink.startsWith('/api/prints/'));
const printRes = await page.request.get(`${BASE}${printLink}`);
ok('print original é servido', printRes.ok() && (printRes.headers()['content-type'] ?? '').startsWith('image/'),
   `${printRes.status()} ${printRes.headers()['content-type'] ?? ''}`);

// 4. painel e relatório refletem a entrega
await page.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
const after = await page.locator('.stat-value').first().innerText();
ok('painel atualiza para 3/4', after.trim() === '3/4', after.trim());
ok('tabela do painel linka o print', await page.locator('a:has-text("print ↗")').count() >= 1);

await page.goto(`${BASE}/r/verao-hidrata-demo`, { waitUntil: 'networkidle' });
const cards = await page.locator('article.card').count();
ok('relatório mostra 3 creators comprovados', cards === 3, `${cards} cards`);
ok('relatório linka o print dos insights', await page.locator('a:has-text("print dos insights")').count() === 1);
const cpm = await page.locator('.stat', { hasText: 'CPM' }).first().locator('.stat-value').innerText();
ok('CPM calculado no relatório', /R\$/.test(cpm), cpm);

// 5. régua continua idempotente e não cobra quem entregou
const run = await (await page.request.get(`${BASE}/api/cron/nudges`)).json();
ok('régua não cobra quem já entregou', !JSON.stringify(run.sent).includes('Carla'), JSON.stringify(run.sent));

// 6. sair e entrar como outra agência pelo link mágico
await Promise.all([
  page.waitForURL(/\/login/, { timeout: 15000 }),
  page.goto(`${BASE}/app`).then(() => page.click('button:has-text("Sair")')),
]);
ok('sair encerra a sessão', page.url().includes('/login'));

await page.fill('#email', 'nova@agencia.com.br');
await Promise.all([
  page.waitForURL(/\/login\?dev=/, { timeout: 15000 }),
  page.click('button:has-text("Enviar link de acesso")'),
]);
await Promise.all([
  page.waitForURL(/\/app$/, { timeout: 15000 }),
  page.click('a:has-text("Abrir link mágico")'),
]);
ok('link mágico loga a agência nova', (await page.locator('.spread .muted').innerText()).includes('nova@agencia.com.br'));
ok('agência nova começa sem campanhas', await page.locator('main .stack .card').count() === 0);

// 7. isolamento: a campanha da demo não existe para a agência nova
const foreign = await page.goto(`${BASE}/app/c/demo`, { waitUntil: 'networkidle' });
ok('campanha de outra agência devolve 404', foreign.status() === 404, String(foreign.status()));

// 8. limite do plano Grátis (5 creators/mês) barra na criação, com mensagem
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
const sixCreators = Array.from({ length: 6 }, (_, i) => `Creator ${i + 1}; @c${i + 1}; c${i + 1}@ex.com; ; 1 post; 100`).join('\n');
await page.fill('#brand', 'Campanha Grande');
await page.fill('#client', 'Cliente Teste');
await page.fill('#creators', sixCreators);
await Promise.all([
  page.waitForURL(/\/app\?erro=/, { timeout: 15000 }),
  page.click('button:has-text("Criar campanha")'),
]);
ok('limite do plano barra 6 creators no Grátis',
   (await page.locator('.card p.small').first().innerText()).includes('Grátis'));

// 9. dentro do limite, a criação funciona
await page.fill('#brand', 'Campanha Pequena');
await page.fill('#client', 'Cliente Teste');
await page.fill('#creators', 'Creator A; @ca; ca@ex.com; ; 1 post; 100\nCreator B; @cb; cb@ex.com; ; 1 post; 100');
await Promise.all([
  page.waitForURL(/\/app\/c\//, { timeout: 15000 }),
  page.click('button:has-text("Criar campanha")'),
]);
ok('campanha dentro do limite é criada', (await page.locator('h1').innerText()).includes('Campanha Pequena'));

await browser.close();
console.log(failures === 0 ? '\nTodos os testes passaram.' : `\n${failures} teste(s) falharam.`);
process.exit(failures === 0 ? 0 : 1);
