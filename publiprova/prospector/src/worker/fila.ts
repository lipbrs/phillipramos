import { and, eq, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "../db/client.ts";
import { jobs } from "../db/schema.ts";

export type Job = typeof jobs.$inferSelect;

/** Tempo que uma job pode ficar travada antes de ser considerada orfa. */
const TEMPO_LIMITE_TRAVA_MS = 5 * 60 * 1000;

const agora = () => new Date().toISOString();

export type EnfileirarInput = {
  kind: string;
  payload?: unknown;
  /** Se repetir, a job nao entra de novo. E o que torna o webhook idempotente. */
  idempotencyKey?: string;
  runAt?: Date;
  maxAttempts?: number;
};

export type EnfileirarResult = { job: Job; criada: boolean };

/**
 * Enfileira uma job. Com `idempotencyKey`, chamar duas vezes devolve a mesma
 * job: quem garante e o indice unico, nao uma checagem de existencia — duas
 * chamadas simultaneas passariam as duas pela checagem.
 */
export async function enfileirar(input: EnfileirarInput): Promise<EnfileirarResult> {
  const inseridas = await db
    .insert(jobs)
    .values({
      kind: input.kind,
      payload: input.payload ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      runAt: (input.runAt ?? new Date()).toISOString(),
      maxAttempts: input.maxAttempts ?? 5,
    })
    .onConflictDoNothing({ target: jobs.idempotencyKey })
    .returning();

  if (inseridas.length > 0) return { job: inseridas[0]!, criada: true };

  const existentes = await db
    .select()
    .from(jobs)
    .where(eq(jobs.idempotencyKey, input.idempotencyKey!))
    .limit(1);
  return { job: existentes[0]!, criada: false };
}

/**
 * Pega a proxima job pronta e a marca como `running` no mesmo UPDATE. O WHERE
 * reafirma `status = 'pending'`, entao dois workers competindo pela mesma linha
 * — so um leva.
 */
export async function pegarProxima(): Promise<Job | undefined> {
  const limite = new Date(Date.now() - TEMPO_LIMITE_TRAVA_MS).toISOString();

  const candidatas = await db
    .select()
    .from(jobs)
    .where(
      and(
        lt(jobs.runAt, agora()),
        or(
          eq(jobs.status, "pending"),
          // Job que ficou travada num worker que morreu volta para a fila.
          and(eq(jobs.status, "running"), or(isNull(jobs.lockedAt), lt(jobs.lockedAt, limite))),
        ),
      ),
    )
    .orderBy(jobs.runAt)
    .limit(5);

  for (const candidata of candidatas) {
    const travadas = await db
      .update(jobs)
      .set({ status: "running", lockedAt: agora(), attempts: candidata.attempts + 1 })
      .where(and(eq(jobs.id, candidata.id), eq(jobs.status, candidata.status)))
      .returning();
    if (travadas.length > 0) return travadas[0]!;
  }
  return undefined;
}

export async function concluir(jobId: number): Promise<void> {
  await db.update(jobs).set({ status: "done", lockedAt: null }).where(eq(jobs.id, jobId));
}

/**
 * Falha com backoff exponencial. Estourou `maxAttempts`, vira `dead` e sai da
 * fila — nunca fica num laco infinito de tentativa.
 */
export async function falhar(job: Job, erro: unknown): Promise<"retry" | "dead"> {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  const esgotou = job.attempts >= job.maxAttempts;

  if (esgotou) {
    await db
      .update(jobs)
      .set({ status: "dead", lastError: mensagem, lockedAt: null })
      .where(eq(jobs.id, job.id));
    return "dead";
  }

  const esperaMs = Math.min(2 ** job.attempts * 1000, 60 * 60 * 1000);
  await db
    .update(jobs)
    .set({
      status: "pending",
      lastError: mensagem,
      lockedAt: null,
      runAt: new Date(Date.now() + esperaMs).toISOString(),
    })
    .where(eq(jobs.id, job.id));
  return "retry";
}

/**
 * Recuperacao apos reinicio: toda job que ficou `running` sem worker vivo volta
 * para `pending`. Roda uma vez no boot.
 */
export async function recuperarOrfas(): Promise<number> {
  const limite = new Date(Date.now() - TEMPO_LIMITE_TRAVA_MS).toISOString();
  const devolvidas = await db
    .update(jobs)
    .set({ status: "pending", lockedAt: null })
    .where(
      and(
        eq(jobs.status, "running"),
        or(isNull(jobs.lockedAt), lt(jobs.lockedAt, limite)),
      ),
    )
    .returning();
  return devolvidas.length;
}

export async function contarPorStatus(): Promise<Record<string, number>> {
  const linhas = await db
    .select({ status: jobs.status, total: sql<number>`count(*)` })
    .from(jobs)
    .groupBy(jobs.status);
  return Object.fromEntries(linhas.map((l) => [l.status, Number(l.total)]));
}
