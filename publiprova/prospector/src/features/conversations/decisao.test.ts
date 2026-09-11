import { describe, expect, it } from "vitest";

import { decidir, ehIntencao, revisarSaida, type Contexto } from "./decisao.ts";

const base: Contexto = {
  intencao: "asked_info",
  confianca: 0.9,
  jaApresentou: false,
  mensagensEnviadas: 1,
  faltandoConfig: [],
};

describe("decisao da proxima acao", () => {
  it("pedido de parar encerra, mesmo com confianca baixa", () => {
    const d = decidir({ ...base, intencao: "opt_out", confianca: 0.1 });
    expect(d.acao).toBe("encerrar");
  });

  it("preco vai para humano — o valor nao esta verificado", () => {
    const d = decidir({ ...base, intencao: "asked_pricing" });
    expect(d.acao).toBe("escalar_humano");
  });

  it("confianca baixa nao vira resposta automatica", () => {
    const d = decidir({ ...base, confianca: 0.4 });
    expect(d.acao).toBe("escalar_humano");
    expect(d.motivo).toMatch(/confianca/);
  });

  it("interessado leva apresentacao, mas so uma vez", () => {
    expect(decidir({ ...base, intencao: "interested" }).acao).toBe("apresentar");
    expect(decidir({ ...base, intencao: "interested", jaApresentou: true }).acao).toBe("responder");
  });

  it("nao encaminha para o WhatsApp sem link configurado", () => {
    const d = decidir({
      ...base,
      intencao: "wants_whatsapp",
      faltandoConfig: ["links.whatsapp"],
    });
    expect(d.acao).toBe("escalar_humano");
    expect(d.motivo).toMatch(/WhatsApp/);
  });

  it("com link configurado, encaminha", () => {
    expect(decidir({ ...base, intencao: "wants_whatsapp" }).acao).toBe("encaminhar_whatsapp");
  });

  it("para de insistir depois do limite de mensagens", () => {
    expect(decidir({ ...base, intencao: "interested", mensagensEnviadas: 5 }).acao).toBe("encerrar");
  });

  it("quem nao e o dono recebe pergunta, e quem vai encaminhar vira follow-up", () => {
    expect(decidir({ ...base, intencao: "not_the_owner" }).acao).toBe("perguntar");
    expect(decidir({ ...base, intencao: "will_forward" }).acao).toBe("agendar_follow_up");
  });

  it("intencao inventada pelo modelo nao passa", () => {
    expect(ehIntencao("interested")).toBe(true);
    expect(ehIntencao("quer_comprar_agora")).toBe(false);
  });
});

describe("revisao da saida", () => {
  it("libera texto limpo", () => {
    const r = revisarSaida("  Oi! O PubliProva ainda esta em construcao.  ");
    expect(r.liberado).toBe(true);
    if (r.liberado) expect(r.texto).toBe("Oi! O PubliProva ainda esta em construcao.");
  });

  it("bloqueia afirmacao nao verificada, mesmo escrita a mao", () => {
    const r = revisarSaida("Custa R$ 247 por mes.");
    expect(r.liberado).toBe(false);
    if (!r.liberado) expect(r.motivo).toMatch(/price/);
  });

  it("bloqueia placeholder que escapou da config", () => {
    const r = revisarSaida("Chama no {{https://wa.me/55...}}");
    expect(r.liberado).toBe(false);
    if (!r.liberado) expect(r.motivo).toMatch(/placeholder/);
  });

  it("bloqueia vazio e texto longo demais", () => {
    expect(revisarSaida("   ").liberado).toBe(false);
    expect(revisarSaida("a".repeat(901)).liberado).toBe(false);
  });
});
