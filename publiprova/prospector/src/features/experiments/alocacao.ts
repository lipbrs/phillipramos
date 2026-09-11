import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db/client.ts";
import { assignments, experiments, variants } from "../../db/schema.ts";

export type Experimento = typeof experiments.$inferSelect;
export type Variante = typeof variants.$inferSelect;

/**
 * Fatia minima que fica sempre explorando, mesmo depois de uma variante virar
 * campea. Sem esse piso o sistema congela na primeira coisa que funcionou e
 * para de descobrir o que funcionaria melhor.
 */
export const PISO_DE_EXPLORACAO = 0.1;

/**
 * Escolhe a variante para um lead. A alocacao e gravada com unique em
 * (experimento, lead): o mesmo lead nunca cai em dois bracos, e chamar duas
 * vezes devolve sempre a mesma variante.
 */
export async function alocar(
  experimentoId: number,
  leadId: number,
  sorteio: () => number = Math.random,
): Promise<Variante> {
  const jaAlocado = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.experimentId, experimentoId), eq(assignments.leadId, leadId)))
    .limit(1);

  if (jaAlocado[0]) {
    const [v] = await db.select().from(variants).where(eq(variants.id, jaAlocado[0].variantId));
    return v!;
  }

  const opcoes = await db.select().from(variants).where(eq(variants.experimentId, experimentoId));
  if (opcoes.length === 0) throw new Error(`experimento ${experimentoId} nao tem variantes`);

  const escolhida = sortear(opcoes, sorteio);

  const inserida = await db
    .insert(assignments)
    .values({ experimentId: experimentoId, variantId: escolhida.id, leadId })
    .onConflictDoNothing({ target: [assignments.experimentId, assignments.leadId] })
    .returning();

  if (inserida.length > 0) return escolhida;

  // Perdeu a corrida: vale a alocacao de quem chegou primeiro.
  const [vencedora] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.experimentId, experimentoId), eq(assignments.leadId, leadId)))
    .limit(1);
  const [v] = await db.select().from(variants).where(eq(variants.id, vencedora!.variantId));
  return v!;
}

function sortear(opcoes: Variante[], sorteio: () => number): Variante {
  const total = opcoes.reduce((soma, v) => soma + Math.max(0, v.weight), 0);
  if (total <= 0) return opcoes[0]!;

  let ponto = sorteio() * total;
  for (const v of opcoes) {
    ponto -= Math.max(0, v.weight);
    if (ponto <= 0) return v;
  }
  return opcoes[opcoes.length - 1]!;
}

export type Resultado = {
  varianteId: number;
  nome: string;
  controle: boolean;
  alocados: number;
  convertidos: number;
  taxa: number;
};

/**
 * Compara os bracos por uma metrica que e um evento ja gravado — nao por um
 * numero que alguem digitou. `metrica` e o `kind` do evento que conta como
 * conversao (por exemplo "stage_changed" para whatsapp_handoff).
 */
export async function resultados(experimentoId: number, metrica: string): Promise<Resultado[]> {
  const { events } = await import("../../db/schema.ts");

  const linhas = await db
    .select({
      varianteId: variants.id,
      nome: variants.name,
      controle: variants.isControl,
      alocados: sql<number>`count(distinct ${assignments.leadId})`,
      convertidos: sql<number>`count(distinct case when ${events.kind} = ${metrica} then ${events.leadId} end)`,
    })
    .from(variants)
    .leftJoin(assignments, eq(assignments.variantId, variants.id))
    .leftJoin(events, eq(events.leadId, assignments.leadId))
    .where(eq(variants.experimentId, experimentoId))
    .groupBy(variants.id);

  return linhas.map((l) => {
    const alocados = Number(l.alocados);
    const convertidos = Number(l.convertidos);
    return {
      varianteId: l.varianteId,
      nome: l.nome,
      controle: Boolean(l.controle),
      alocados,
      convertidos,
      taxa: alocados > 0 ? convertidos / alocados : 0,
    };
  });
}

export type Veredito =
  | { decidido: false; motivo: string }
  | { decidido: true; vencedoraId: number; nome: string; taxa: number; contra: number };

/**
 * So declara vencedor com amostra suficiente em TODOS os bracos e com uma
 * diferenca que nao cabe no acaso. E deliberadamente conservador: declarar cedo
 * e o erro classico de teste A/B, e aqui ele custa mensagem pior para agencia
 * real durante semanas.
 */
export function decidirVencedora(
  linhas: Resultado[],
  minimoPorBraco: number,
  diferencaMinima = 0.2,
): Veredito {
  if (linhas.length < 2) return { decidido: false, motivo: "experimento tem menos de 2 bracos" };

  const semAmostra = linhas.filter((l) => l.alocados < minimoPorBraco);
  if (semAmostra.length > 0) {
    const faltam = semAmostra
      .map((l) => `${l.nome} (${l.alocados}/${minimoPorBraco})`)
      .join(", ");
    return { decidido: false, motivo: `amostra insuficiente em: ${faltam}` };
  }

  const ordenadas = [...linhas].sort((a, b) => b.taxa - a.taxa);
  const melhor = ordenadas[0]!;
  const segunda = ordenadas[1]!;

  if (melhor.taxa === 0) return { decidido: false, motivo: "nenhum braco converteu ainda" };

  const ganho = segunda.taxa === 0 ? Infinity : (melhor.taxa - segunda.taxa) / segunda.taxa;
  if (ganho < diferencaMinima) {
    return {
      decidido: false,
      motivo: `diferenca de ${(ganho * 100).toFixed(1)}% abaixo do minimo de ${(diferencaMinima * 100).toFixed(0)}%`,
    };
  }

  return {
    decidido: true,
    vencedoraId: melhor.varianteId,
    nome: melhor.nome,
    taxa: melhor.taxa,
    contra: segunda.taxa,
  };
}

/**
 * Aumenta o peso da campea aos poucos, mantendo o piso de exploracao. Nao vai
 * de 50/50 para 100/0 — mudanca de estrategia tem de ser reversivel.
 */
export function pesosApos(vencedoraId: number, linhas: Resultado[]): Record<number, number> {
  const outras = linhas.filter((l) => l.varianteId !== vencedoraId);
  const pesoDasOutras = outras.length > 0 ? PISO_DE_EXPLORACAO / outras.length : 0;

  const pesos: Record<number, number> = { [vencedoraId]: 1 - PISO_DE_EXPLORACAO };
  for (const o of outras) pesos[o.varianteId] = pesoDasOutras;
  return pesos;
}
