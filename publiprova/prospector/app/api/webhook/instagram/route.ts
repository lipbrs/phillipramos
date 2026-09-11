import { processarEvento } from "../../../../src/features/conversations/entrada.ts";
import { assinaturaConfere, responderVerificacao } from "../../../../src/integrations/instagram/assinatura.ts";
import { normalizar, payloadWebhook } from "../../../../src/integrations/instagram/eventos.ts";
import { recordEvent } from "../../../../src/features/leads/repository.ts";
import { env } from "../../../../src/lib/env.ts";

/**
 * A porta de entrada da Meta.
 *
 * Duas coisas que nao podem mudar aqui:
 *
 * 1. A assinatura e conferida sobre o corpo CRU. Reserializar o JSON muda um
 *    espaco e a assinatura legitima passa a ser recusada.
 * 2. A resposta e 200 mesmo quando o evento nao interessa. A Meta repete o que
 *    nao recebe 200 e, insistindo, suspende a inscricao do webhook.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Handshake de verificacao, feito uma vez ao cadastrar a URL no painel da Meta. */
export function GET(req: Request): Response {
  const esperado = env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (!esperado) {
    return new Response("INSTAGRAM_WEBHOOK_VERIFY_TOKEN nao configurado", { status: 503 });
  }

  const challenge = responderVerificacao(new URL(req.url).searchParams, esperado);
  if (!challenge) return new Response("verificacao recusada", { status: 403 });
  return new Response(challenge, { status: 200 });
}

export async function POST(req: Request): Promise<Response> {
  const segredo = env.INSTAGRAM_APP_SECRET;
  if (!segredo) {
    return new Response("INSTAGRAM_APP_SECRET nao configurado", { status: 503 });
  }

  const corpoCru = await req.text();

  if (!assinaturaConfere(corpoCru, req.headers.get("x-hub-signature-256"), segredo)) {
    // Sem 200 aqui: assinatura errada nao e evento nosso.
    return new Response("assinatura invalida", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(corpoCru);
  } catch {
    return new Response("corpo nao e JSON", { status: 400 });
  }

  const validado = payloadWebhook.safeParse(payload);
  if (!validado.success) {
    await recordEvent(null, "webhook_em_formato_desconhecido", {
      erro: validado.error.issues.slice(0, 3),
    });
    // 200 de proposito: formato novo da Meta nao pode derrubar a inscricao.
    return Response.json({ ok: true, ignorado: "formato desconhecido" });
  }

  const eventos = normalizar(validado.data, env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "");
  const resultados: unknown[] = [];

  for (const evento of eventos) {
    try {
      resultados.push(await processarEvento(evento));
    } catch (erro) {
      // Um evento ruim nao pode impedir os outros do mesmo lote de entrar.
      await recordEvent(null, "falha_ao_processar_evento", {
        idExterno: evento.idExterno,
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      resultados.push({ acao: "erro", idExterno: evento.idExterno });
    }
  }

  return Response.json({ ok: true, processados: resultados.length, resultados });
}
