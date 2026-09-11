import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "prospector-fila-"));
process.env.DATABASE_URL = `file:${join(dir, "fila.db").replace(/\\/g, "/")}`;

type Fila = typeof import("./fila.ts");
let fila: Fila;

beforeAll(async () => {
  const { runMigrations } = await import("../db/migrate.ts");
  await runMigrations();
  fila = await import("./fila.ts");
});

afterAll(async () => {
  const { closeDb } = await import("../db/client.ts");
  closeDb();
});

describe("idempotencia da fila", () => {
  it("a mesma chave nao entra duas vezes", async () => {
    const a = await fila.enfileirar({
      kind: "responder_comentario",
      idempotencyKey: "comentario:17841",
      payload: { comentarioId: "17841" },
    });
    const b = await fila.enfileirar({
      kind: "responder_comentario",
      idempotencyKey: "comentario:17841",
      payload: { comentarioId: "17841" },
    });
    expect(a.criada).toBe(true);
    expect(b.criada).toBe(false);
    expect(b.job.id).toBe(a.job.id);
  });

  it("aguenta o mesmo webhook chegando cinco vezes juntas", async () => {
    const todas = await Promise.all(
      Array.from({ length: 5 }, () =>
        fila.enfileirar({ kind: "mensagem_recebida", idempotencyKey: "msg:abc123" }),
      ),
    );
    expect(todas.filter((r) => r.criada)).toHaveLength(1);
    expect(new Set(todas.map((r) => r.job.id)).size).toBe(1);
  });

  it("sem chave de idempotencia, cada chamada e uma job nova", async () => {
    const a = await fila.enfileirar({ kind: "varrer_comentarios" });
    const b = await fila.enfileirar({ kind: "varrer_comentarios" });
    expect(a.job.id).not.toBe(b.job.id);
  });
});

describe("execucao e retry", () => {
  it("uma job so e pega por um worker", async () => {
    await fila.enfileirar({ kind: "exclusiva", idempotencyKey: "exclusiva:1" });
    const disputados = await Promise.all([
      fila.pegarProxima(),
      fila.pegarProxima(),
      fila.pegarProxima(),
    ]);
    const ids = disputados.filter(Boolean).map((j) => j!.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("falha reagenda com backoff e conta a tentativa", async () => {
    const { job } = await fila.enfileirar({ kind: "instavel", idempotencyKey: "instavel:1" });
    const pega = await fila.pegarProxima();
    expect(pega).toBeDefined();

    const desfecho = await fila.falhar({ ...job, attempts: 1 }, new Error("rede caiu"));
    expect(desfecho).toBe("retry");
  });

  it("estourou o limite, vira dead e sai da fila", async () => {
    const { job } = await fila.enfileirar({
      kind: "condenada",
      idempotencyKey: "condenada:1",
      maxAttempts: 2,
    });
    const desfecho = await fila.falhar({ ...job, attempts: 2, maxAttempts: 2 }, new Error("400"));
    expect(desfecho).toBe("dead");

    const contagem = await fila.contarPorStatus();
    expect(contagem.dead).toBeGreaterThanOrEqual(1);
  });
});

describe("recuperacao apos reinicio", () => {
  it("job travada num worker morto volta para a fila", async () => {
    const { job } = await fila.enfileirar({ kind: "orfa", idempotencyKey: "orfa:1" });

    // Simula worker que morreu no meio: running, com trava antiga.
    const { db } = await import("../db/client.ts");
    const { jobs } = await import("../db/schema.ts");
    const { eq } = await import("drizzle-orm");
    await db
      .update(jobs)
      .set({
        status: "running",
        lockedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      })
      .where(eq(jobs.id, job.id));

    const devolvidas = await fila.recuperarOrfas();
    expect(devolvidas).toBeGreaterThanOrEqual(1);

    const depois = await db.select().from(jobs).where(eq(jobs.id, job.id));
    expect(depois[0]!.status).toBe("pending");
    expect(depois[0]!.lockedAt).toBeNull();
  });
});
