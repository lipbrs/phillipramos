import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "prospector-entrada-"));
process.env.DATABASE_URL = `file:${join(dir, "entrada.db").replace(/\\/g, "/")}`;

type Entrada = typeof import("./entrada.ts");
type Repo = typeof import("../leads/repository.ts");
type Fila = typeof import("../../worker/fila.ts");

let entrada: Entrada;
let repo: Repo;
let fila: Fila;

const comentario = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    tipo: "comentario" as const,
    idExterno: "c1",
    igUserId: "ig-1",
    username: "agencia.exemplo",
    texto: "RELATORIO",
    postId: "post-1",
    ...over,
  }) as Parameters<Entrada["processarEvento"]>[0];

const mensagem = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    tipo: "mensagem" as const,
    idExterno: "m1",
    igUserId: "ig-1",
    texto: "oi, quero saber mais",
    ...over,
  }) as Parameters<Entrada["processarEvento"]>[0];

beforeAll(async () => {
  const { runMigrations } = await import("../../db/migrate.ts");
  await runMigrations();
  entrada = await import("./entrada.ts");
  repo = await import("../leads/repository.ts");
  fila = await import("../../worker/fila.ts");
});

afterAll(async () => {
  const { closeDb } = await import("../../db/client.ts");
  closeDb();
});

describe("comentario com palavra-chave vira lead", () => {
  it("cria o lead e enfileira a resposta privada", async () => {
    const r = await entrada.processarEvento(comentario());
    expect(r.acao).toBe("lead_criado");
    if (r.acao === "lead_criado") {
      expect(r.jobEnfileirada).toBe(true);
      const lead = await repo.getLead(r.leadId);
      expect(lead.handle).toBe("agencia.exemplo");
      expect(lead.originKeyword).toBe("RELATORIO");
      expect(lead.channelState).toBe("inbound_pending");
      expect(lead.messagingWindowExpiresAt).toBeTruthy();
    }
  });

  it("o mesmo comentario chegando de novo nao duplica a job", async () => {
    await entrada.processarEvento(comentario());
    const contagem = await fila.contarPorStatus();
    const total = Object.values(contagem).reduce((a, b) => a + b, 0);

    await entrada.processarEvento(comentario());
    await entrada.processarEvento(comentario());

    const depois = await fila.contarPorStatus();
    expect(Object.values(depois).reduce((a, b) => a + b, 0)).toBe(total);
  });

  it("comentario sem palavra-chave nao cria lead", async () => {
    const r = await entrada.processarEvento(
      comentario({ idExterno: "c2", igUserId: "ig-2", texto: "top demais!" }),
    );
    expect(r.acao).toBe("ignorado");
    expect(await repo.findByHandle("agencia.exemplo", "customer")).toBeDefined();
    const semLead = await repo.findByHandle("ig_ig-2", "customer");
    expect(semLead).toBeUndefined();
  });

  it("palavra-chave e casada por palavra inteira, sem acento e sem caixa", async () => {
    const r = await entrada.processarEvento(
      comentario({ idExterno: "c3", igUserId: "ig-3", username: "outra", texto: "relatório pf" }),
    );
    expect(r.acao).toBe("lead_criado");

    const naoDispara = await entrada.processarEvento(
      comentario({ idExterno: "c4", igUserId: "ig-4", username: "terceira", texto: "relatorios" }),
    );
    expect(naoDispara.acao).toBe("ignorado");
  });
});

describe("mensagem recebida", () => {
  it("abre a janela e passa o canal para a API", async () => {
    const lead = await repo.findByHandle("agencia.exemplo", "customer");
    await repo.setChannelState(lead!.id, "private_reply_sent", "teste");
    await repo.setChannelState(lead!.id, "waiting_inbound_reply", "teste");

    const r = await entrada.processarEvento(mensagem());
    expect(r.acao).toBe("lead_existente");

    const depois = await repo.getLead(lead!.id);
    expect(depois.channelState).toBe("api_eligible");
    expect(depois.messagingWindowExpiresAt).toBeTruthy();
  });

  it("a mesma mensagem duas vezes e processada uma vez so", async () => {
    const r = await entrada.processarEvento(mensagem());
    expect(r.acao).toBe("ignorado");
    if (r.acao === "ignorado") expect(r.motivo).toMatch(/ja processada/);
  });

  it("quem nunca comentou mas mandou DM tambem entra", async () => {
    const r = await entrada.processarEvento(
      mensagem({ idExterno: "m9", igUserId: "ig-99", texto: "vi seu post, como funciona?" }),
    );
    expect(r.acao).toBe("lead_existente");
    const lead = await repo.findByHandle("ig_ig-99", "customer");
    expect(lead).toBeDefined();
    expect(lead!.source).toBe("inbound_dm");
  });
});

describe("pedido de parar", () => {
  it("e atendido na hora, sem passar por IA", async () => {
    const r = await entrada.processarEvento(
      mensagem({ idExterno: "m10", igUserId: "ig-50", texto: "para de me mandar isso" }),
    );
    expect(r.acao).toBe("opt_out");
    if (r.acao === "opt_out") {
      const lead = await repo.getLead(r.leadId);
      expect(lead.channelState).toBe("do_not_contact");
      expect(lead.optOutAt).toBeTruthy();
    }
  });

  it("reconhece variacoes com e sem acento", () => {
    for (const frase of [
      "PARE",
      "não quero receber",
      "nao quero",
      "me tira dessa lista",
      "isso é spam",
      "sem interesse, obrigado",
    ]) {
      expect(entrada.pediuParaParar(frase), frase).toBe(true);
    }
    expect(entrada.pediuParaParar("quero sim, me manda")).toBe(false);
  });

  it("quem pediu para parar e comenta de novo nao gera job", async () => {
    const r = await entrada.processarEvento(
      comentario({ idExterno: "c50", igUserId: "ig-50", username: "ig_ig-50", texto: "RELATORIO" }),
    );
    expect(r.acao).toBe("lead_existente");
    if (r.acao === "lead_existente") expect(r.jobEnfileirada).toBe(false);
  });
});
