import { readFileSync, writeFileSync } from "node:fs";

/**
 * Confere os quatro valores do `.env` contra a API real, **sem enviar nada**.
 *
 * Só leitura de diagnóstico: descobre se o token vale, de qual conta ele é,
 * quanto tempo tem de vida e se o id configurado é o mesmo da conta do token.
 * Errar o id é o defeito mais chato de achar depois, porque a Meta responde
 * 400 sem dizer qual dos dois campos está trocado.
 *
 * Também cuida do token, e os dois casos num comando só: o botão "Gerar token"
 * do painel já entrega um de 60 dias, e aqui ele é renovado; se por outro
 * caminho vier o token curto de 1 hora, a troca é feita.
 *
 * Nada do token é impresso. O que aparece na tela é conclusão, não segredo.
 */

const CAMINHO = ".env";

function ler(texto, chave) {
  const linha = texto.split("\n").find((l) => l.startsWith(`${chave}=`));
  return linha ? linha.slice(chave.length + 1).trim() : "";
}

function escrever(texto, chave, valor) {
  const linhas = texto.split("\n");
  const i = linhas.findIndex((l) => l.startsWith(`${chave}=`));
  if (i === -1) return `${texto.trimEnd()}\n${chave}=${valor}\n`;
  linhas[i] = `${chave}=${valor}`;
  return linhas.join("\n");
}

let texto = readFileSync(CAMINHO, "utf8");

/**
 * Grava token e data de vencimento. A data vai como variável, não comentário,
 * porque o worker a lê no boot para avisar antes de o token morrer.
 */
function gravarToken(novo, vence) {
  texto = escrever(texto, "INSTAGRAM_PAGE_ACCESS_TOKEN", novo);
  texto = escrever(texto, "INSTAGRAM_TOKEN_VENCE_EM", vence.toISOString().slice(0, 10));
  writeFileSync(CAMINHO, texto);
}

const token = ler(texto, "INSTAGRAM_PAGE_ACCESS_TOKEN");
const segredo = ler(texto, "INSTAGRAM_APP_SECRET");
const contaId = ler(texto, "INSTAGRAM_BUSINESS_ACCOUNT_ID");
const verify = ler(texto, "INSTAGRAM_WEBHOOK_VERIFY_TOKEN");

let falhou = false;
const diga = (ok, msg) => {
  console.log(`${ok ? "  ok  " : " FALHA"}  ${msg}`);
  if (!ok) falhou = true;
};

console.log("\nConferindo o .env contra a API do Instagram (nada e enviado)\n");

diga(segredo.length === 32, `chave secreta do app: ${segredo.length} caracteres (esperado 32)`);
diga(/^\d{15,20}$/.test(contaId), `id da conta: ${contaId || "vazio"}`);
diga(verify.length >= 16, `token de verificacao do webhook: ${verify.length} caracteres`);

if (!token) {
  diga(false, "INSTAGRAM_PAGE_ACCESS_TOKEN esta vazio");
} else {
  // 1. O token vale? De quem ele e?
  const meUrl = new URL("https://graph.instagram.com/v23.0/me");
  meUrl.searchParams.set("fields", "user_id,username");
  meUrl.searchParams.set("access_token", token);

  const me = await fetch(meUrl);
  const corpoMe = await me.text();

  if (!me.ok) {
    diga(false, `token recusado (${me.status})`);
    console.log(`\n  A Meta disse: ${corpoMe.slice(0, 400)}\n`);
  } else {
    const dados = JSON.parse(corpoMe);
    diga(true, `token valido, conta @${dados.username}`);

    const bate = String(dados.user_id) === contaId;
    diga(
      bate,
      bate
        ? "id da conta bate com o token"
        : `id do .env (${contaId}) NAO bate com o do token (${dados.user_id})`,
    );

    // 2. Quanto tempo de vida tem? `ig_refresh_token` responde isso e, de
    //    quebra, renova. So funciona em token longo — se recusar, e porque o
    //    token ainda e o curto de 1 hora, e o caminho e a troca.
    const refUrl = new URL("https://graph.instagram.com/refresh_access_token");
    refUrl.searchParams.set("grant_type", "ig_refresh_token");
    refUrl.searchParams.set("access_token", token);

    const ref = await fetch(refUrl);
    const corpoRef = await ref.text();

    if (ref.ok) {
      const r = JSON.parse(corpoRef);
      const dias = Math.round(Number(r.expires_in ?? 0) / 86400);
      const vence = new Date(Date.now() + Number(r.expires_in ?? 0) * 1000);
      diga(true, `token de longa duracao, renovado agora: vence em ${dias} dias`);

      if (r.access_token && r.access_token !== token) {
        gravarToken(r.access_token, vence);
        console.log(`        gravado no .env; vence em ${vence.toLocaleDateString("pt-BR")}`);
      }
    } else {
      const trocaUrl = new URL("https://graph.instagram.com/access_token");
      trocaUrl.searchParams.set("grant_type", "ig_exchange_token");
      trocaUrl.searchParams.set("client_secret", segredo);
      trocaUrl.searchParams.set("access_token", token);

      const troca = await fetch(trocaUrl);
      const corpoTroca = await troca.text();

      if (!troca.ok) {
        diga(false, "token e curto e a troca pelo de 60 dias falhou");
        console.log(`\n  A Meta disse: ${corpoTroca.slice(0, 400)}`);
        console.log("  Se a mensagem fala de chave secreta: existem duas no painel.");
        console.log("  Use a do Instagram, nao a de Configuracoes > Basico.\n");
      } else {
        const t = JSON.parse(corpoTroca);
        const vence = new Date(Date.now() + Number(t.expires_in ?? 0) * 1000);
        const dias = Math.round(Number(t.expires_in ?? 0) / 86400);
        gravarToken(t.access_token, vence);
        diga(true, `token curto trocado pelo de longa duracao: vence em ${dias} dias`);
      }
    }
  }
}

console.log(
  falhou
    ? "\nTem coisa errada acima. Nada foi enviado.\n"
    : "\nOs quatro valores conferem. Nada foi enviado.\n",
);

if (falhou) process.exitCode = 1;
