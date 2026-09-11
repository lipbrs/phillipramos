import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The env module reads process.env at import time, so the temp database has to
// be set before anything touches it.
const dir = mkdtempSync(join(tmpdir(), "prospector-test-"));
process.env.DATABASE_URL = `file:${join(dir, "test.db").replace(/\\/g, "/")}`;

type Repo = typeof import("./repository.ts");
let repo: Repo;

beforeAll(async () => {
  const { runMigrations } = await import("../../db/migrate.ts");
  await runMigrations();
  repo = await import("./repository.ts");
});

afterAll(async () => {
  // Close the connection so the file is not left open. The directory itself is
  // left to the OS: on Windows the handle lingers briefly and deleting here
  // makes the suite fail for a reason that has nothing to do with the code.
  const { closeDb } = await import("../../db/client.ts");
  closeDb();
});

describe("descoberta sem duplicidade", () => {
  it("cria o lead na primeira vez", async () => {
    const r = await repo.discoverLead({
      handle: "@AgenciaTeste",
      funnel: "customer",
      source: "comment_keyword",
      originKeyword: "RELATORIO",
    });
    expect(r.created).toBe(true);
    expect(r.lead.handle).toBe("agenciateste");
    expect(r.lead.stage).toBe("discovered");
    expect(r.lead.channelState).toBe("inbound_pending");
  });

  it("nao duplica com @ nem com caixa diferente", async () => {
    const a = await repo.discoverLead({
      handle: "agenciateste",
      funnel: "customer",
      source: "vidiq_search",
    });
    const b = await repo.discoverLead({
      handle: "@AGENCIATESTE",
      funnel: "customer",
      source: "manual",
    });
    expect(a.created).toBe(false);
    expect(b.created).toBe(false);
    expect(a.lead.id).toBe(b.lead.id);
  });

  it("o mesmo handle pode existir nos dois funis", async () => {
    const afiliado = await repo.discoverLead({
      handle: "agenciateste",
      funnel: "affiliate",
      source: "manual",
    });
    expect(afiliado.created).toBe(true);
  });

  it("aguenta descobertas simultaneas sem criar duas linhas", async () => {
    const feitas = await Promise.all(
      Array.from({ length: 5 }, () =>
        repo.discoverLead({ handle: "corrida", funnel: "customer", source: "comment_keyword" }),
      ),
    );
    const criados = feitas.filter((r) => r.created);
    const ids = new Set(feitas.map((r) => r.lead.id));
    expect(criados).toHaveLength(1);
    expect(ids.size).toBe(1);
  });
});

describe("transicoes atomicas e auditaveis", () => {
  it("avanca e grava evento", async () => {
    const { lead } = await repo.discoverLead({
      handle: "fluxo",
      funnel: "customer",
      source: "comment_keyword",
    });
    await repo.advanceStage(lead.id, "qualified", "score 82");
    const depois = await repo.advanceStage(lead.id, "contacted");
    expect(depois.stage).toBe("contacted");

    const linha = await repo.timeline(lead.id);
    const tipos = linha.map((e) => e.kind);
    expect(tipos).toEqual(["lead_discovered", "stage_changed", "stage_changed"]);
  });

  it("recusa pulo de etapa e nao grava nada", async () => {
    const { lead } = await repo.discoverLead({
      handle: "pulo",
      funnel: "customer",
      source: "manual",
    });
    await expect(repo.advanceStage(lead.id, "active_customer")).rejects.toThrow(
      /Transicao de pipeline invalida/,
    );
    const atual = await repo.getLead(lead.id);
    expect(atual.stage).toBe("discovered");
    expect(await repo.timeline(lead.id)).toHaveLength(1);
  });
});

describe("pedido de parar e permanente", () => {
  it("bloqueia o canal e some da fila", async () => {
    const { lead } = await repo.discoverLead({
      handle: "saiu",
      funnel: "customer",
      source: "comment_keyword",
    });
    const depois = await repo.markDoNotContact(lead.id, "pediu para parar");
    expect(depois.channelState).toBe("do_not_contact");
    expect(depois.optOutAt).toBeTruthy();
    expect(depois.nextActionAt).toBeNull();
  });

  it("nao reentra nem por outro funil nem por outra origem", async () => {
    const outroFunil = await repo.discoverLead({
      handle: "saiu",
      funnel: "affiliate",
      source: "vidiq_search",
    });
    expect(outroFunil.suppressed).toBe(true);
    expect(outroFunil.lead.channelState).toBe("do_not_contact");
  });

  it("nada sai de do_not_contact", async () => {
    const lead = await repo.findByHandle("saiu", "customer");
    await expect(repo.setChannelState(lead!.id, "api_eligible")).rejects.toThrow(
      /Transicao de canal invalida/,
    );
  });
});
