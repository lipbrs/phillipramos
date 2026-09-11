import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "prospector-orcamento-"));
process.env.DATABASE_URL = `file:${join(dir, "orcamento.db").replace(/\\/g, "/")}`;
process.env.OPENAI_MONTHLY_BUDGET_USD = "1";

type Orc = typeof import("./orcamento.ts");
let orc: Orc;

beforeAll(async () => {
  const { runMigrations } = await import("../../db/migrate.ts");
  await runMigrations();
  orc = await import("./orcamento.ts");
});

afterAll(async () => {
  const { closeDb } = await import("../../db/client.ts");
  closeDb();
});

describe("custo estimado", () => {
  it("usa a tabela do modelo", () => {
    // gpt-5-mini: 0,25 por milhao de entrada, 2 por milhao de saida.
    const c = orc.custoEstimado("gpt-5-mini", 1_000_000, 1_000_000);
    expect(c).toBeCloseTo(2.25, 6);
  });

  it("modelo desconhecido cai no fallback caro, nao em zero", () => {
    const desconhecido = orc.custoEstimado("modelo-que-nao-existe", 1_000_000, 0);
    expect(desconhecido).toBeGreaterThan(orc.custoEstimado("gpt-5", 1_000_000, 0));
  });
});

describe("corte por orcamento", () => {
  it("deixa passar enquanto ha saldo", async () => {
    const estado = await orc.exigirOrcamento();
    expect(estado.estourou).toBe(false);
    expect(estado.tetoUsd).toBe(1);
  });

  it("acumula o gasto registrado", async () => {
    await orc.registrarChamada({
      purpose: "classificar",
      model: "gpt-5-mini",
      promptTokens: 200_000,
      completionTokens: 100_000,
    });
    const estado = await orc.estadoOrcamento();
    expect(estado.gastoUsd).toBeGreaterThan(0);
    expect(estado.gastoUsd).toBeLessThan(1);
    expect(estado.estourou).toBe(false);
  });

  it("estourou o teto, a proxima chamada e recusada", async () => {
    await orc.registrarChamada({
      purpose: "redigir",
      model: "gpt-5",
      promptTokens: 1_000_000,
      completionTokens: 200_000,
    });
    const estado = await orc.estadoOrcamento();
    expect(estado.estourou).toBe(true);
    expect(estado.restanteUsd).toBe(0);

    await expect(orc.exigirOrcamento()).rejects.toThrow(/Orcamento do mes estourado/);
  });

  it("mostra custo por lead e por cliente ativo", async () => {
    const { discoverLead } = await import("../../features/leads/repository.ts");
    await discoverLead({ handle: "custo1", funnel: "customer", source: "manual" });
    await discoverLead({ handle: "custo2", funnel: "customer", source: "manual" });

    const r = await orc.custoPorResultado();
    expect(r.leads).toBe(2);
    expect(r.usdPorLead).toBeCloseTo(r.totalUsd / 2, 8);
    // Sem cliente ativo ainda, o custo por cliente e desconhecido, nao zero.
    expect(r.clientesAtivos).toBe(0);
    expect(r.usdPorClienteAtivo).toBeNull();
  });
});
