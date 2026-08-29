// Renderiza as artes do carrossel 01 em PNG usando o Chrome do sistema.
// Uso: node render.mjs            (na pasta validacao/artes)
// Pré-requisito p/ slide 07: app rodando em http://localhost:3000 (npm run dev em web/).
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
// playwright-core vive nas dependências do app em web/
const { chromium } = createRequire(path.join(aqui, '..', '..', 'web', 'package.json'))('playwright-core');
const saida = path.join(aqui, 'out');
fs.mkdirSync(saida, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });

// O selo "N" do modo dev do Next aparece nos prints; some com ele antes de fotografar.
const tiraBadgeDev = (p) => p.evaluate(() => {
  document.querySelectorAll('nextjs-portal, [data-nextjs-toast], [data-next-badge], [data-nextjs-dev-tools-button]')
    .forEach((e) => e.remove());
});

// 1. Print real do painel (modo demonstração) — segue sem ele se o app não estiver de pé.
const printPainel = path.join(aqui, 'painel-print.png');
try {
  await page.goto('http://localhost:3000/login', { timeout: 8000 });
  await page.getByText('Entrar na conta de demonstração').click();
  await page.waitForLoadState('networkidle');
  if (!page.url().includes('/login')) {
    // A visão que conta a história é a da campanha (status por creator), não a lista.
    await page.getByText('Verão Hidrata').first().click();
    await page.waitForURL('**/app/c/**');
    await page.waitForLoadState('networkidle');
    await tiraBadgeDev(page);
    await page.screenshot({ path: printPainel });
    console.log('painel-print.png capturado de', page.url());

    // Tela do creator (rota /e/): acha um link de creator na página da campanha
    // e fotografa em viewport de celular.
    const linkCreator = await page.evaluate(() => {
      const direto = [...document.querySelectorAll('a')].find(el => el.href.includes('/e/'));
      if (direto) return direto.href;
      // O link do creator vai codificado dentro da mensagem do botão de WhatsApp.
      for (const a of document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')) {
        const m = decodeURIComponent(a.href).match(/https?:\/\/[^\s"]+\/e\/[A-Za-z0-9]+/);
        if (m) return m[0];
      }
      return null;
    });
    if (linkCreator) {
      const cel = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
      await cel.goto(linkCreator);
      await cel.waitForLoadState('networkidle');
      await tiraBadgeDev(cel);
      await cel.screenshot({ path: path.join(aqui, 'creator-print.png') });
      await cel.close();
      console.log('creator-print.png capturado de', linkCreator);
    } else {
      console.log('nenhum link /e/ encontrado na página da campanha');
    }
  }
} catch (e) {
  console.log('App não respondeu em localhost:3000 — slide 07 fica pendente.', e.message.split('\n')[0]);
}

// 2. Renderiza cada .frame do HTML.
await page.goto('file://' + path.join(aqui, 'carrossel-01.html'));
await page.waitForLoadState('networkidle');
for (const frame of await page.locator('.frame').all()) {
  const nome = await frame.getAttribute('data-nome');
  if (nome === 'slide-07-produto' && !fs.existsSync(printPainel)) {
    console.log('pulado:', nome, '(sem painel-print.png)');
    continue;
  }
  await frame.scrollIntoViewIfNeeded();
  await frame.screenshot({ path: path.join(saida, nome + '.png') });
  console.log('ok:', nome + '.png');
}

await browser.close();
