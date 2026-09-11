import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "prospector-seg-"));
process.env.DATABASE_URL = `file:${join(dir, "seg.db").replace(/\\/g, "/")}`;

type Seg = typeof import("./seguranca.ts");
let seg: Seg;

beforeAll(async () => {
  const { runMigrations } = await import("../db/migrate.ts");
  await runMigrations();
  seg = await import("./seguranca.ts");
});

afterAll(async () => {
  const { closeDb } = await import("../db/client.ts");
  closeDb();
});

describe("pausa geral", () => {
  it("comeca despausado", async () => {
    expect((await seg.estadoDaPausa()).pausado).toBe(false);
    await expect(seg.exigirSistemaAtivo()).resolves.toBeUndefined();
  });

  it("pausa bloqueia qualquer acao e guarda o motivo", async () => {
    await seg.pausar("restricao_do_instagram", "conta recebeu aviso");
    const estado = await seg.estadoDaPausa();
    expect(estado.pausado).toBe(true);
    expect(estado.motivo).toBe("restricao_do_instagram");
    expect(estado.desde).toBeTruthy();

    await expect(seg.exigirSistemaAtivo()).rejects.toThrow(/Sistema pausado/);
  });

  it("a pausa vira excecao na fila do operador", async () => {
    const abertas = await seg.excecoesAbertas();
    expect(abertas.some((e) => e.kind === "pausa:restricao_do_instagram")).toBe(true);
  });

  it("retomar libera de novo", async () => {
    await seg.retomar();
    expect((await seg.estadoDaPausa()).pausado).toBe(false);
    await expect(seg.exigirSistemaAtivo()).resolves.toBeUndefined();
  });
});

describe("circuit breaker por erro em sequencia", () => {
  it("nao pausa antes do limite", async () => {
    await seg.zerarErros();
    for (let i = 1; i < seg.LIMITE_DE_ERROS; i++) {
      const r = await seg.registrarErro(`falha ${i}`);
      expect(r.pausou).toBe(false);
      expect(r.total).toBe(i);
    }
    expect((await seg.estadoDaPausa()).pausado).toBe(false);
  });

  it("ao bater o limite, pausa o sistema", async () => {
    const r = await seg.registrarErro("a gota d'agua");
    expect(r.pausou).toBe(true);
    expect(r.total).toBe(seg.LIMITE_DE_ERROS);

    const estado = await seg.estadoDaPausa();
    expect(estado.pausado).toBe(true);
    expect(estado.motivo).toBe("erro_em_sequencia");
  });

  it("um sucesso zera a contagem", async () => {
    await seg.retomar();
    await seg.registrarErro("isolada");
    await seg.registrarSucesso();
    const r = await seg.registrarErro("depois do sucesso");
    expect(r.total).toBe(1);
    expect(r.pausou).toBe(false);
  });
});

describe("horario de operacao", () => {
  const fuso = "America/Sao_Paulo";

  it("aceita dentro da janela", () => {
    // 15:00 UTC = 12:00 em Sao Paulo (UTC-3)
    const meioDia = new Date("2026-09-10T15:00:00Z");
    expect(seg.dentroDoHorario("09:00-20:00", fuso, meioDia)).toBe(true);
  });

  it("recusa de madrugada", () => {
    // 06:00 UTC = 03:00 em Sao Paulo
    const madrugada = new Date("2026-09-10T06:00:00Z");
    expect(seg.dentroDoHorario("09:00-20:00", fuso, madrugada)).toBe(false);
  });

  it("recusa depois do fim da janela", () => {
    // 01:00 UTC do dia 11 = 22:00 do dia 10 em Sao Paulo
    const noite = new Date("2026-09-11T01:00:00Z");
    expect(seg.dentroDoHorario("09:00-20:00", fuso, noite)).toBe(false);
  });
});
