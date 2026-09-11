import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "prospector-exp-"));
process.env.DATABASE_URL = `file:${join(dir, "exp.db").replace(/\\/g, "/")}`;

type Aloc = typeof import("./alocacao.ts");
let aloc: Aloc;
let experimentoId: number;
let varianteA: number;
let varianteB: number;

beforeAll(async () => {
  const { runMigrations } = await import("../../db/migrate.ts");
  await runMigrations();
  aloc = await import("./alocacao.ts");

  const { db } = await import("../../db/client.ts");
  const { experiments, variants } = await import("../../db/schema.ts");

  const [exp] = await db
    .insert(experiments)
    .values({
      name: "abertura_da_resposta",
      variable: "opening_line",
      funnel: "customer",
      status: "running",
      minSampleSize: 3,
      primaryMetric: "stage_changed",
    })
    .returning();
  experimentoId = exp!.id;

  const criadas = await db
    .insert(variants)
    .values([
      {
        experimentId: experimentoId,
        name: "controle",
        isControl: true,
        weight: 1,
        content: { abertura: "Oi! Vi seu comentario." },
      },
      {
        experimentId: experimentoId,
        name: "pergunta",
        isControl: false,
        weight: 1,
        content: { abertura: "Oi! Posso te perguntar uma coisa?" },
      },
    ])
    .returning();
  varianteA = criadas[0]!.id;
  varianteB = criadas[1]!.id;
});

afterAll(async () => {
  const { closeDb } = await import("../../db/client.ts");
  closeDb();
});

async function criarLead(handle: string): Promise<number> {
  const { discoverLead } = await import("../leads/repository.ts");
  const { lead } = await discoverLead({ handle, funnel: "customer", source: "manual" });
  return lead.id;
}

describe("alocacao", () => {
  it("o mesmo lead cai sempre na mesma variante", async () => {
    const leadId = await criarLead("estavel");
    const primeira = await aloc.alocar(experimentoId, leadId);
    const segunda = await aloc.alocar(experimentoId, leadId);
    const terceira = await aloc.alocar(experimentoId, leadId);
    expect(segunda.id).toBe(primeira.id);
    expect(terceira.id).toBe(primeira.id);
  });

  it("respeita o peso no sorteio", async () => {
    const l1 = await criarLead("sorteio1");
    // sorteio proximo de zero cai no primeiro braco
    const v1 = await aloc.alocar(experimentoId, l1, () => 0.01);
    expect(v1.id).toBe(varianteA);

    const l2 = await criarLead("sorteio2");
    // sorteio proximo de um cai no ultimo
    const v2 = await aloc.alocar(experimentoId, l2, () => 0.99);
    expect(v2.id).toBe(varianteB);
  });

  it("alocacoes simultaneas do mesmo lead nao criam dois bracos", async () => {
    const leadId = await criarLead("corrida-exp");
    const todas = await Promise.all([
      aloc.alocar(experimentoId, leadId),
      aloc.alocar(experimentoId, leadId),
      aloc.alocar(experimentoId, leadId),
    ]);
    expect(new Set(todas.map((v) => v.id)).size).toBe(1);
  });
});

describe("veredito", () => {
  const linha = (over: Partial<Aloc extends never ? never : any> = {}) => ({
    varianteId: 1,
    nome: "controle",
    controle: true,
    alocados: 50,
    convertidos: 10,
    taxa: 0.2,
    ...over,
  });

  it("nao decide sem amostra em todos os bracos", () => {
    const v = aloc.decidirVencedora(
      [linha(), linha({ varianteId: 2, nome: "b", alocados: 5, convertidos: 3, taxa: 0.6 })],
      50,
    );
    expect(v.decidido).toBe(false);
    if (!v.decidido) expect(v.motivo).toMatch(/amostra insuficiente/);
  });

  it("nao decide com diferenca pequena", () => {
    const v = aloc.decidirVencedora(
      [
        linha({ taxa: 0.2 }),
        linha({ varianteId: 2, nome: "b", convertidos: 11, taxa: 0.22 }),
      ],
      50,
    );
    expect(v.decidido).toBe(false);
    if (!v.decidido) expect(v.motivo).toMatch(/diferenca/);
  });

  it("decide com amostra e diferenca claras", () => {
    const v = aloc.decidirVencedora(
      [
        linha({ taxa: 0.2 }),
        linha({ varianteId: 2, nome: "pergunta", controle: false, convertidos: 20, taxa: 0.4 }),
      ],
      50,
    );
    expect(v.decidido).toBe(true);
    if (v.decidido) {
      expect(v.nome).toBe("pergunta");
      expect(v.taxa).toBe(0.4);
    }
  });

  it("nao decide quando ninguem converteu", () => {
    const v = aloc.decidirVencedora(
      [linha({ convertidos: 0, taxa: 0 }), linha({ varianteId: 2, convertidos: 0, taxa: 0 })],
      50,
    );
    expect(v.decidido).toBe(false);
    if (!v.decidido) expect(v.motivo).toMatch(/nenhum braco converteu/);
  });

  it("um braco so nunca decide", () => {
    expect(aloc.decidirVencedora([linha()], 1).decidido).toBe(false);
  });
});

describe("pesos depois da decisao", () => {
  it("a campea sobe mas o piso de exploracao fica", () => {
    const pesos = aloc.pesosApos(2, [
      { varianteId: 1, nome: "a", controle: true, alocados: 50, convertidos: 10, taxa: 0.2 },
      { varianteId: 2, nome: "b", controle: false, alocados: 50, convertidos: 20, taxa: 0.4 },
    ]);
    expect(pesos[2]).toBeCloseTo(0.9, 6);
    expect(pesos[1]).toBeCloseTo(aloc.PISO_DE_EXPLORACAO, 6);
    // Ninguem e zerado: a estrategia continua reversivel.
    expect(pesos[1]).toBeGreaterThan(0);
  });
});
