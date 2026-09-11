import { describe, expect, it } from "vitest";

import { checkClaims } from "./claims.ts";
import { loadBusiness, oQueFalta, resetBusinessCache } from "./business.ts";

describe("regra de afirmacoes", () => {
  it("aceita o que esta verificado", () => {
    const ok = [
      "Oi! O PubliProva ainda esta em construcao — estamos ouvindo 15 agencias antes de abrir.",
      "Cada creator recebe um link unico e entrega sem criar conta e sem senha.",
      "A cobranca automatica tem cinco tempos: D-2, D0, D+1, D+3 e D+7.",
      "O relatorio do cliente se monta durante a campanha, com a marca da agencia.",
    ];
    for (const text of ok) {
      expect(checkClaims(text), text).toEqual({ ok: true });
    }
  });

  it("bloqueia preco", () => {
    const r = checkClaims("Fica R$ 247 por mes no plano Agencia.");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations.map((v) => v.rule)).toContain("price");
  });

  it("bloqueia estatistica sem contexto", () => {
    const r = checkClaims("Voce perde 8 a 15 horas por mes cobrando print.");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations.map((v) => v.rule)).toContain("metric");
  });

  it("bloqueia contagem de clientes", () => {
    const r = checkClaims("Ja temos 40 agencias usando todo dia.");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations.map((v) => v.rule)).toContain("customer_count");
  });

  it("bloqueia promessa de resultado", () => {
    const r = checkClaims("Garanto que vai aumentar sua renovacao.");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const rules = r.violations.map((v) => v.rule);
      expect(rules).toContain("guarantee");
    }
  });

  it("bloqueia superlativo e exclusividade", () => {
    const r = checkClaims("Somos o unico sistema que faz isso no Brasil.");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations.map((v) => v.rule)).toContain("superlative");
  });

  it("bloqueia promessa de aprovacao de conta", () => {
    const r = checkClaims("A aprovacao da sua conta sai na hora, sem KYC.");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations.map((v) => v.rule)).toContain("account_promise");
  });

  it("acumula varias violacoes na mesma mensagem", () => {
    const r = checkClaims("Garanto 30% a mais de renovacao por R$ 247/mes. Somos os primeiros.");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations.length).toBeGreaterThanOrEqual(3);
  });

  it("nao vaza estado entre chamadas (regex /g reusada)", () => {
    const text = "Fica R$ 247 por mes.";
    expect(checkClaims(text)).toEqual(checkClaims(text));
  });
});

describe("config do negocio", () => {
  it("carrega e valida o business.json real", () => {
    resetBusinessCache();
    const b = loadBusiness();
    expect(b.company.name).toBe("PUBLIPROVA");
    expect(b.company.instagramHandle).toBe("@PUBLIPROVA.APP");
    expect(b.verifiedClaims.length).toBeGreaterThan(0);
    expect(b.icp.segments.length).toBeGreaterThan(0);
  });

  it("aponta o que ainda falta para destravar recurso desligado", () => {
    resetBusinessCache();
    const faltando = oQueFalta(loadBusiness()).join(" | ");
    expect(faltando).toMatch(/links\.whatsapp/);
    expect(faltando).toMatch(/links\.affiliateGroup/);
  });

  it("hoje so o funil de clientes esta ligado", () => {
    resetBusinessCache();
    const b = loadBusiness();
    expect(b.funisAtivos).toEqual(["customer"]);
    expect(b.palavrasChave.every((p) => p.funil === "customer")).toBe(true);
  });

  it("nenhuma palavra manda para o WhatsApp, que nao existe", () => {
    resetBusinessCache();
    const b = loadBusiness();
    expect(b.palavrasChave.some((p) => p.destino.tipo === "whatsapp")).toBe(false);
  });

  it("todo destino entrega o que o post prometeu", () => {
    resetBusinessCache();
    const b = loadBusiness();
    const porPalavra = Object.fromEntries(b.palavrasChave.map((p) => [p.palavra, p.destino.tipo]));
    expect(porPalavra.RELATORIO).toBe("demo");
    expect(porPalavra.PRINT).toBe("conteudo_na_dm");
    expect(porPalavra.EU).toBe("pesquisa");
  });

  it("toda claim verificada passa no proprio filtro", () => {
    resetBusinessCache();
    const b = loadBusiness();
    const reprovadas = b.verifiedClaims.filter((c) => !checkClaims(c).ok);
    expect(reprovadas).toEqual([]);
  });
});
