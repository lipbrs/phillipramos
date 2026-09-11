import { describe, expect, it } from "vitest";

import { decidir, ehIntencao, revisarSaida, type Contexto } from "./decisao.ts";

const base: Contexto = {
  intencao: "asked_info",
  confianca: 0.9,
  destino: "demo",
  jaEntregou: false,
  mensagensEnviadas: 1,
  whatsappConfigurado: false,
};

describe("decisao da proxima acao", () => {
  it("pedido de parar encerra, mesmo com confianca baixa", () => {
    expect(decidir({ ...base, intencao: "opt_out", confianca: 0.1 }).acao).toBe("encerrar");
  });

  it("preco vai para humano — o valor nao esta verificado", () => {
    expect(decidir({ ...base, intencao: "asked_pricing" }).acao).toBe("escalar_humano");
  });

  it("confianca baixa nao vira resposta automatica", () => {
    const d = decidir({ ...base, confianca: 0.4 });
    expect(d.acao).toBe("escalar_humano");
    expect(d.motivo).toMatch(/confianca/);
  });

  it("interessado recebe o que o post prometeu, e so uma vez", () => {
    expect(decidir({ ...base, intencao: "interested" }).acao).toBe("entregar_promessa");
    expect(decidir({ ...base, intencao: "interested", jaEntregou: true }).acao).toBe("responder");
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

describe("roteamento pelo destino configurado", () => {
  it("entrega a promessa qualquer que seja o destino real", () => {
    for (const destino of ["demo", "conteudo_na_dm", "pesquisa"] as const) {
      const d = decidir({ ...base, intencao: "interested", destino });
      expect(d.acao, destino).toBe("entregar_promessa");
    }
  });

  it("sem WhatsApp, quem pede outro canal vai para humano", () => {
    const d = decidir({ ...base, intencao: "wants_whatsapp", destino: "demo" });
    expect(d.acao).toBe("escalar_humano");
    expect(d.motivo).toMatch(/nao temos WhatsApp/);
  });

  it("destino WhatsApp sem link configurado nunca envia", () => {
    const d = decidir({
      ...base,
      intencao: "interested",
      destino: "whatsapp",
      whatsappConfigurado: false,
    });
    expect(d.acao).toBe("escalar_humano");
    expect(d.motivo).toMatch(/link nao existe/);
  });

  it("quando o WhatsApp existir, o encaminhamento volta a funcionar", () => {
    const d = decidir({
      ...base,
      intencao: "wants_whatsapp",
      destino: "whatsapp",
      whatsappConfigurado: true,
    });
    expect(d.acao).toBe("encaminhar_whatsapp");
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
