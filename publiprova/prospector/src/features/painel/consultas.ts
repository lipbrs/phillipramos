import { desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "../../db/client.ts";
import { exceptions, leads, messages } from "../../db/schema.ts";
import { CUSTOMER_STAGES, type Funnel } from "../../db/schema.ts";
import { contarPorStatus } from "../../worker/fila.ts";
import { estadoOrcamento, custoPorResultado } from "../../integrations/openai/orcamento.ts";
import { estadoDaPausa } from "../../lib/seguranca.ts";
import { loadBusiness, oQueFalta } from "../../lib/business.ts";
import { env, integrationStatus } from "../../lib/env.ts";
import { enviadosHoje } from "../../worker/executor.ts";

/** Tudo que a primeira tela mostra, numa consulta so por bloco. */
export async function resumoDoPainel() {
  const negocio = loadBusiness();

  const [pausa, fila, orcamento, porResultado, enviados] = await Promise.all([
    estadoDaPausa(),
    contarPorStatus(),
    estadoOrcamento(),
    custoPorResultado(),
    enviadosHoje(),
  ]);

  return {
    pausa,
    fila,
    orcamento,
    porResultado,
    envios: { hoje: enviados, teto: env.MAX_DMS_PER_DAY },
    modo: env.DRY_RUN ? ("simulacao" as const) : ("real" as const),
    janela: `${env.OPERATING_HOURS} (${env.OPERATING_TIMEZONE})`,
    integracoes: integrationStatus(),
    negocio: {
      funisAtivos: negocio.funisAtivos,
      palavras: negocio.palavrasChave.map((p) => ({
        palavra: p.palavra,
        promessa: p.promessa,
        destino: p.destino.tipo,
      })),
      falta: oQueFalta(negocio),
    },
  };
}

/** Kanban: uma coluna por etapa, com os leads dentro. */
export async function funilPorEtapa(funnel: Funnel = "customer") {
  const linhas = await db
    .select()
    .from(leads)
    .where(eq(leads.funnel, funnel))
    .orderBy(desc(leads.updatedAt));

  return CUSTOMER_STAGES.map((etapa) => ({
    etapa,
    leads: linhas.filter((l) => l.stage === etapa),
  }));
}

export async function excecoesAbertas(limite = 50) {
  return db
    .select({
      id: exceptions.id,
      leadId: exceptions.leadId,
      kind: exceptions.kind,
      detail: exceptions.detail,
      createdAt: exceptions.createdAt,
      handle: leads.handle,
    })
    .from(exceptions)
    .leftJoin(leads, eq(exceptions.leadId, leads.id))
    .where(isNull(exceptions.resolvedAt))
    .orderBy(desc(exceptions.createdAt))
    .limit(limite);
}

export async function conversaDoLead(leadId: number) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return undefined;

  const conversa = await db
    .select()
    .from(messages)
    .where(eq(messages.leadId, leadId))
    .orderBy(messages.sentAt);

  const pendencias = await db
    .select()
    .from(exceptions)
    .where(eq(exceptions.leadId, leadId))
    .orderBy(desc(exceptions.createdAt));

  return { lead, conversa, pendencias };
}

/** Quantos leads entraram por cada palavra-chave — diz qual post puxa gente. */
export async function porPalavraChave() {
  const linhas = await db
    .select({
      palavra: leads.originKeyword,
      total: sql<number>`count(*)`,
      respondidos: sql<number>`sum(case when ${leads.channelState} != 'inbound_pending' then 1 else 0 end)`,
    })
    .from(leads)
    .groupBy(leads.originKeyword);

  return linhas
    .filter((l) => l.palavra)
    .map((l) => ({
      palavra: l.palavra as string,
      total: Number(l.total),
      respondidos: Number(l.respondidos ?? 0),
    }));
}
