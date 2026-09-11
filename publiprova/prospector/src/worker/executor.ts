import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "../db/client.ts";
import { messages } from "../db/schema.ts";
import {
  advanceStage,
  getLead,
  recordEvent,
  setChannelState,
} from "../features/leads/repository.ts";
import { assertCanSend, isTerminalChannel } from "../features/leads/transitions.ts";
import { promessaDaPalavra, redigirPrimeiraResposta } from "../features/conversations/redacao.ts";
import { FalhaDeEnvio, type Remetente } from "../integrations/instagram/envio.ts";
import { loadBusiness } from "../lib/business.ts";
import { env } from "../lib/env.ts";
import { dentroDoHorario, registrarExcecao } from "../lib/seguranca.ts";
import type { Job } from "./fila.ts";

/**
 * O que uma job faz quando roda.
 *
 * Toda trava do sistema passa por aqui, e a ordem importa: as gratuitas e
 * irreversiveis primeiro (opt-out, canal, horario), as caras depois. Um lead
 * que pediu para parar nao chega a custar uma chamada de API.
 */

export type Resultado =
  | { tipo: "enviado"; leadId: number; externalId: string; simulado: boolean }
  | { tipo: "adiado"; ate: Date; motivo: string }
  | { tipo: "ignorado"; motivo: string }
  | { tipo: "escalado"; leadId: number; motivo: string };

export type Contexto = {
  remetente: Remetente;
  agora?: Date;
};

/** Quantos envios nossos ja sairam hoje. E o teto de saude da conta. */
export async function enviadosHoje(agora = new Date()): Promise<number> {
  const inicioDoDia = new Date(agora);
  inicioDoDia.setUTCHours(0, 0, 0, 0);

  const [linha] = await db
    .select({ total: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(eq(messages.direction, "outbound"), gte(messages.sentAt, inicioDoDia.toISOString())),
    );
  return Number(linha?.total ?? 0);
}

/** Proximo horario util dentro da janela de operacao. */
function proximaJanela(agora: Date, janela: string): Date {
  const inicio = janela.split("-")[0] ?? "09:00";
  const [h, m] = inicio.split(":").map(Number);
  const alvo = new Date(agora);
  alvo.setHours(h ?? 9, m ?? 0, 0, 0);
  if (alvo <= agora) alvo.setDate(alvo.getDate() + 1);
  return alvo;
}

export async function executar(job: Job, ctx: Contexto): Promise<Resultado> {
  switch (job.kind) {
    case "responder_comentario":
      return responderComentario(job, ctx);
    case "responder_mensagem":
      return responderMensagem(job, ctx);
    default:
      throw new Error(`job de tipo desconhecido: ${job.kind}`);
  }
}

type PayloadComentario = { leadId: number; comentarioId: string; palavra: string };

async function responderComentario(job: Job, ctx: Contexto): Promise<Resultado> {
  const payload = job.payload as PayloadComentario;
  const agora = ctx.agora ?? new Date();
  const lead = await getLead(payload.leadId);

  // 1. Quem pediu para parar nunca mais recebe nada, por nenhum canal.
  if (isTerminalChannel(lead.channelState)) {
    return { tipo: "ignorado", motivo: `canal terminal: ${lead.channelState}` };
  }

  // 2. A trava de canal. Se outro worker ja respondeu, o estado saiu de
  //    `inbound_pending` e esta envio nao acontece — e o que torna a duplicata
  //    impossivel, nao improvavel.
  try {
    assertCanSend(lead.channelState, "private_reply");
  } catch (erro) {
    return { tipo: "ignorado", motivo: (erro as Error).message };
  }

  // 3. Horario. Adiar e melhor do que falhar: a job volta sozinha.
  if (!dentroDoHorario(env.OPERATING_HOURS, env.OPERATING_TIMEZONE, agora)) {
    const ate = proximaJanela(agora, env.OPERATING_HOURS);
    return { tipo: "adiado", ate, motivo: `fora da janela ${env.OPERATING_HOURS}` };
  }

  // 4. Teto diario.
  if ((await enviadosHoje(agora)) >= env.MAX_DMS_PER_DAY) {
    const ate = new Date(agora.getTime() + 60 * 60 * 1000);
    return { tipo: "adiado", ate, motivo: `teto de ${env.MAX_DMS_PER_DAY} envios no dia` };
  }

  // 5. O que o post prometeu para aquela palavra.
  const negocio = loadBusiness();
  const promessa = promessaDaPalavra(negocio, payload.palavra);
  if (!promessa) {
    await escalar(lead.id, `palavra "${payload.palavra}" nao existe mais na configuracao`);
    return { tipo: "escalado", leadId: lead.id, motivo: "palavra removida da configuracao" };
  }

  // 6. Redacao e portao das afirmacoes. Nada sai sem passar por aqui.
  const revisao = redigirPrimeiraResposta(promessa, negocio);
  if (!revisao.liberado) {
    await escalar(lead.id, `texto barrado no portao: ${revisao.motivo}`);
    return { tipo: "escalado", leadId: lead.id, motivo: revisao.motivo };
  }

  // 7. Envio.
  const enviado = await ctx.remetente.enviar({
    tipo: "private_reply",
    comentarioId: payload.comentarioId,
    texto: revisao.texto,
  });

  // 8. Registro. O unique em `external_id` e a ultima defesa: se o envio saiu
  //    mas o worker morreu antes de gravar, a repeticao para aqui.
  const gravadas = await db
    .insert(messages)
    .values({
      leadId: lead.id,
      direction: "outbound",
      channel: "private_reply",
      body: revisao.texto,
      externalId: enviado.externalId,
    })
    .onConflictDoNothing({ target: messages.externalId })
    .returning();

  if (gravadas.length === 0) {
    return { tipo: "ignorado", motivo: "mensagem ja registrada — envio repetido barrado" };
  }

  await setChannelState(lead.id, "private_reply_sent", "resposta privada ao comentario");

  // Quem digitou a palavra-chave se qualificou sozinho: leu o post e se
  // identificou. A etapa passa pelo `qualified` em vez de pular, para o
  // historico dizer por que o lead foi considerado qualificado.
  if (lead.stage === "discovered") {
    await advanceStage(lead.id, "qualified", `comentou "${promessa.palavra}" num post nosso`);
  }
  if (lead.stage === "discovered" || lead.stage === "qualified") {
    await advanceStage(lead.id, "contacted", "primeira resposta enviada");
  }
  await recordEvent(lead.id, "promessa_entregue", {
    palavra: promessa.palavra,
    destino: promessa.destino.tipo,
    simulado: enviado.simulado,
  });

  return {
    tipo: "enviado",
    leadId: lead.id,
    externalId: enviado.externalId,
    simulado: enviado.simulado,
  };
}

type PayloadMensagem = { leadId: number; mensagemId: string };

/**
 * Resposta a quem escreveu de volta.
 *
 * Aqui a conversa deixa de ser previsivel e precisaria do classificador. Ele
 * ainda nao existe, entao o caminho honesto e a fila de excecoes: o Phillip
 * responde. Melhor uma conversa esperando do que uma resposta inventada.
 */
async function responderMensagem(job: Job, _ctx: Contexto): Promise<Resultado> {
  const payload = job.payload as PayloadMensagem;
  const lead = await getLead(payload.leadId);

  if (isTerminalChannel(lead.channelState)) {
    return { tipo: "ignorado", motivo: `canal terminal: ${lead.channelState}` };
  }

  await escalar(
    lead.id,
    `lead respondeu (mensagem ${payload.mensagemId}) e o classificador ainda nao existe`,
  );
  if (lead.channelState !== "human_review_required") {
    await setChannelState(lead.id, "human_review_required", "resposta de lead aguarda humano");
  }
  return { tipo: "escalado", leadId: lead.id, motivo: "resposta precisa de humano" };
}

async function escalar(leadId: number, detalhe: string): Promise<void> {
  await registrarExcecao({ leadId, kind: "precisa_de_humano", detail: detalhe });
}

/** Erro de envio que nao adianta repetir vira excecao, nao nova tentativa. */
export function ehDefinitivo(erro: unknown): boolean {
  return erro instanceof FalhaDeEnvio && !erro.retentavel;
}
