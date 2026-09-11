import { and, gte, sql } from "drizzle-orm";

import { db } from "../../db/client.ts";
import { aiCalls } from "../../db/schema.ts";
import { env } from "../../lib/env.ts";

/**
 * Preco por milhao de tokens, em dolar. Fica aqui e nao no .env porque e tabela
 * do fornecedor, nao configuracao do operador. Modelo desconhecido cai no
 * fallback caro de proposito: e melhor superestimar e pausar cedo do que
 * descobrir o estouro na fatura.
 */
const PRECOS: Record<string, { entrada: number; saida: number }> = {
  "gpt-5": { entrada: 1.25, saida: 10 },
  "gpt-5-mini": { entrada: 0.25, saida: 2 },
  "gpt-5-nano": { entrada: 0.05, saida: 0.4 },
};

const FALLBACK = { entrada: 5, saida: 20 };

export function custoEstimado(modelo: string, tokensEntrada: number, tokensSaida: number): number {
  const preco = PRECOS[modelo] ?? FALLBACK;
  return (tokensEntrada / 1_000_000) * preco.entrada + (tokensSaida / 1_000_000) * preco.saida;
}

function inicioDoMesUTC(): string {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1)).toISOString();
}

export async function gastoDoMesUsd(): Promise<number> {
  const [linha] = await db
    .select({ total: sql<number>`coalesce(sum(${aiCalls.costUsd}), 0)` })
    .from(aiCalls)
    .where(gte(aiCalls.createdAt, inicioDoMesUTC()));
  return Number(linha?.total ?? 0);
}

export type EstadoOrcamento = {
  gastoUsd: number;
  tetoUsd: number;
  restanteUsd: number;
  percentual: number;
  estourou: boolean;
};

export async function estadoOrcamento(): Promise<EstadoOrcamento> {
  const gastoUsd = await gastoDoMesUsd();
  const tetoUsd = env.OPENAI_MONTHLY_BUDGET_USD;
  return {
    gastoUsd,
    tetoUsd,
    restanteUsd: Math.max(0, tetoUsd - gastoUsd),
    percentual: tetoUsd > 0 ? gastoUsd / tetoUsd : 1,
    estourou: gastoUsd >= tetoUsd,
  };
}

export class OrcamentoEstourado extends Error {
  readonly estado: EstadoOrcamento;

  constructor(estado: EstadoOrcamento) {
    super(
      `Orcamento do mes estourado: US$ ${estado.gastoUsd.toFixed(2)} de US$ ${estado.tetoUsd.toFixed(2)}`,
    );
    this.estado = estado;
    this.name = "OrcamentoEstourado";
  }
}

/** Chamada antes de cada uso do modelo. Estourou, o worker para. */
export async function exigirOrcamento(): Promise<EstadoOrcamento> {
  const estado = await estadoOrcamento();
  if (estado.estourou) throw new OrcamentoEstourado(estado);
  return estado;
}

export async function registrarChamada(input: {
  leadId?: number | null;
  purpose: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}): Promise<number> {
  const costUsd = custoEstimado(input.model, input.promptTokens, input.completionTokens);
  await db.insert(aiCalls).values({
    leadId: input.leadId ?? null,
    purpose: input.purpose,
    model: input.model,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    costUsd,
  });
  return costUsd;
}

/** Custo por lead e por cliente ativo — o que diz se a automacao da lucro. */
export async function custoPorResultado(): Promise<{
  totalUsd: number;
  leads: number;
  clientesAtivos: number;
  usdPorLead: number | null;
  usdPorClienteAtivo: number | null;
}> {
  const { leads } = await import("../../db/schema.ts");
  const [custo] = await db
    .select({ total: sql<number>`coalesce(sum(${aiCalls.costUsd}), 0)` })
    .from(aiCalls);
  const [totalLeads] = await db.select({ n: sql<number>`count(*)` }).from(leads);
  const [ativos] = await db
    .select({ n: sql<number>`count(*)` })
    .from(leads)
    .where(and(sql`${leads.stage} = 'active_customer'`));

  const totalUsd = Number(custo?.total ?? 0);
  const nLeads = Number(totalLeads?.n ?? 0);
  const nAtivos = Number(ativos?.n ?? 0);

  return {
    totalUsd,
    leads: nLeads,
    clientesAtivos: nAtivos,
    usdPorLead: nLeads > 0 ? totalUsd / nLeads : null,
    usdPorClienteAtivo: nAtivos > 0 ? totalUsd / nAtivos : null,
  };
}
