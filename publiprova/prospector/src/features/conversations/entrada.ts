import { eq } from "drizzle-orm";

import { db } from "../../db/client.ts";
import { leads, messages, type Funnel } from "../../db/schema.ts";
import {
  palavraChaveDo,
  type EventoNormalizado,
} from "../../integrations/instagram/eventos.ts";
import { loadBusiness } from "../../lib/business.ts";
import {
  discoverLead,
  getLead,
  markDoNotContact,
  recordEvent,
  setChannelState,
  type Lead,
} from "../leads/repository.ts";
import { enfileirar } from "../../worker/fila.ts";

/**
 * Frases que significam "para de me mandar mensagem". Atendidas na hora, antes
 * de qualquer interpretacao por IA — pedido de parar nao passa por modelo.
 */
const PEDIDOS_DE_PARAR = [
  "para de",
  "parar",
  "pare",
  "nao quero",
  "não quero",
  "sai fora",
  "me tira",
  "descadastr",
  "remover",
  "spam",
  "nao me chame",
  "não me chame",
  "sem interesse",
];

/** Janela padrao de mensagem da Meta depois que a pessoa escreve: 24 horas. */
const JANELA_MENSAGEM_MS = 24 * 60 * 60 * 1000;
/** Janela da resposta privada a comentario: 7 dias. */
const JANELA_COMENTARIO_MS = 7 * 24 * 60 * 60 * 1000;

export type ResultadoEntrada =
  | { acao: "ignorado"; motivo: string }
  | { acao: "lead_criado" | "lead_existente"; leadId: number; jobEnfileirada: boolean }
  | { acao: "opt_out"; leadId: number };

export function pediuParaParar(texto: string): boolean {
  const limpo = texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return PEDIDOS_DE_PARAR.some((frase) =>
    limpo.includes(
      frase
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase(),
    ),
  );
}

/**
 * Porta de entrada unica. Todo evento do webhook passa por aqui, e a
 * idempotencia vem das chaves unicas (mensagem por `external_id`, job por
 * `idempotency_key`) — reprocessar o mesmo evento nao duplica nada.
 */
export async function processarEvento(evento: EventoNormalizado): Promise<ResultadoEntrada> {
  return evento.tipo === "comentario"
    ? processarComentario(evento)
    : processarMensagem(evento);
}

async function processarComentario(
  evento: Extract<EventoNormalizado, { tipo: "comentario" }>,
): Promise<ResultadoEntrada> {
  const negocio = loadBusiness();
  const encontrada = palavraChaveDo(
    evento.texto,
    negocio.palavrasChave.map((p) => p.palavra),
  );

  if (!encontrada) {
    await recordEvent(null, "comentario_sem_palavra_chave", {
      idExterno: evento.idExterno,
      igUserId: evento.igUserId,
    });
    return { acao: "ignorado", motivo: "comentario sem palavra-chave" };
  }

  const config = negocio.palavrasChave.find((p) => p.palavra === encontrada)!;
  const handle = evento.username ?? `ig_${evento.igUserId}`;

  const { lead, created, suppressed } = await discoverLead({
    handle,
    funnel: config.funil as Funnel,
    source: "comment_keyword",
    igUserId: evento.igUserId,
    originKeyword: encontrada,
    originPostId: evento.postId ?? null,
    sourceDetail: `comentario ${evento.idExterno}`,
  });

  if (suppressed) {
    await recordEvent(lead.id, "comentario_de_quem_pediu_para_parar", {
      idExterno: evento.idExterno,
    });
    return { acao: "lead_existente", leadId: lead.id, jobEnfileirada: false };
  }

  // Guarda o comentario como mensagem recebida. O unique em external_id faz o
  // reprocessamento ser inofensivo.
  await registrarMensagem(lead.id, "inbound", "comment", evento.texto, evento.idExterno);

  await db
    .update(leads)
    .set({
      messagingWindowExpiresAt: new Date(Date.now() + JANELA_COMENTARIO_MS).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(leads.id, lead.id));

  // A job so e enfileirada se o canal ainda permite o primeiro contato.
  const atual = await getLead(lead.id);
  const podeResponder = atual.channelState === "inbound_pending";

  if (podeResponder) {
    await enfileirar({
      kind: "responder_comentario",
      idempotencyKey: `comentario:${evento.idExterno}`,
      payload: { leadId: lead.id, comentarioId: evento.idExterno, palavra: encontrada },
    });
  }

  return {
    acao: created ? "lead_criado" : "lead_existente",
    leadId: lead.id,
    jobEnfileirada: podeResponder,
  };
}

async function processarMensagem(
  evento: Extract<EventoNormalizado, { tipo: "mensagem" }>,
): Promise<ResultadoEntrada> {
  const existente = await acharPorIgUserId(evento.igUserId);

  // Alguem que nunca comentou mas mandou DM: e inbound legitimo, entra tambem.
  const lead =
    existente ??
    (
      await discoverLead({
        handle: `ig_${evento.igUserId}`,
        funnel: "customer",
        source: "inbound_dm",
        igUserId: evento.igUserId,
        sourceDetail: `mensagem ${evento.idExterno}`,
      })
    ).lead;

  const novaMensagem = await registrarMensagem(
    lead.id,
    "inbound",
    "api_dm",
    evento.texto,
    evento.idExterno,
  );

  if (!novaMensagem) {
    return { acao: "ignorado", motivo: "mensagem ja processada" };
  }

  if (pediuParaParar(evento.texto)) {
    await markDoNotContact(lead.id, `pedido no texto: "${evento.texto.slice(0, 120)}"`);
    return { acao: "opt_out", leadId: lead.id };
  }

  // A pessoa escreveu: a janela de 24 h abre e o canal passa para a API.
  await db
    .update(leads)
    .set({
      messagingWindowExpiresAt: new Date(Date.now() + JANELA_MENSAGEM_MS).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(leads.id, lead.id));

  const atual = await getLead(lead.id);
  const elegivel: string[] = ["private_reply_sent", "waiting_inbound_reply", "api_window_closed"];

  if (elegivel.includes(atual.channelState)) {
    await setChannelState(lead.id, "api_eligible", "lead respondeu");
  }

  const depois = await getLead(lead.id);
  const podeResponder = depois.channelState === "api_eligible" || depois.channelState === "api_active";

  if (podeResponder) {
    await enfileirar({
      kind: "responder_mensagem",
      idempotencyKey: `mensagem:${evento.idExterno}`,
      payload: { leadId: lead.id, mensagemId: evento.idExterno },
    });
  }

  return { acao: "lead_existente", leadId: lead.id, jobEnfileirada: podeResponder };
}

async function acharPorIgUserId(igUserId: string): Promise<Lead | undefined> {
  const linhas = await db.select().from(leads).where(eq(leads.igUserId, igUserId)).limit(1);
  return linhas[0];
}

/** Devolve false quando a mensagem ja existia — o unique em external_id decide. */
async function registrarMensagem(
  leadId: number,
  direction: "inbound" | "outbound",
  channel: string,
  body: string,
  externalId: string,
): Promise<boolean> {
  const inseridas = await db
    .insert(messages)
    .values({ leadId, direction, channel, body, externalId })
    .onConflictDoNothing({ target: messages.externalId })
    .returning();
  return inseridas.length > 0;
}
