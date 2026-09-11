import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { assinaturaConfere, responderVerificacao } from "./assinatura.ts";
import { normalizar, palavraChaveDo, payloadWebhook } from "./eventos.ts";

const SEGREDO = "segredo-do-app";
const assinar = (corpo: string) =>
  "sha256=" + createHmac("sha256", SEGREDO).update(corpo, "utf8").digest("hex");

describe("assinatura do webhook", () => {
  const corpo = JSON.stringify({ object: "instagram", entry: [] });

  it("aceita assinatura correta", () => {
    expect(assinaturaConfere(corpo, assinar(corpo), SEGREDO)).toBe(true);
  });

  it("recusa corpo adulterado", () => {
    const assinatura = assinar(corpo);
    const adulterado = JSON.stringify({ object: "instagram", entry: [{ id: "hack" }] });
    expect(assinaturaConfere(adulterado, assinatura, SEGREDO)).toBe(false);
  });

  it("recusa segredo errado", () => {
    expect(assinaturaConfere(corpo, assinar(corpo), "outro-segredo")).toBe(false);
  });

  it("recusa cabecalho ausente, vazio ou de outro algoritmo", () => {
    expect(assinaturaConfere(corpo, null, SEGREDO)).toBe(false);
    expect(assinaturaConfere(corpo, "", SEGREDO)).toBe(false);
    expect(assinaturaConfere(corpo, "sha1=abcdef", SEGREDO)).toBe(false);
    expect(assinaturaConfere(corpo, "sha256=", SEGREDO)).toBe(false);
  });

  it("recusa assinatura de tamanho diferente sem explodir", () => {
    expect(assinaturaConfere(corpo, "sha256=abc", SEGREDO)).toBe(false);
  });
});

describe("handshake de verificacao", () => {
  const token = "meu-token";

  it("devolve o challenge quando o token bate", () => {
    const p = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.verify_token": token,
      "hub.challenge": "12345",
    });
    expect(responderVerificacao(p, token)).toBe("12345");
  });

  it("recusa token errado e modo errado", () => {
    const errado = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.verify_token": "chutado",
      "hub.challenge": "12345",
    });
    expect(responderVerificacao(errado, token)).toBeNull();

    const modo = new URLSearchParams({
      "hub.mode": "unsubscribe",
      "hub.verify_token": token,
      "hub.challenge": "12345",
    });
    expect(responderVerificacao(modo, token)).toBeNull();
  });
});

describe("normalizacao do payload", () => {
  it("extrai comentario e mensagem", () => {
    const bruto = {
      object: "instagram",
      entry: [
        {
          id: "conta",
          changes: [
            {
              field: "comments",
              value: {
                id: "c1",
                text: "RELATORIO",
                from: { id: "ig-1", username: "agencia" },
                media: { id: "post-1" },
              },
            },
          ],
        },
        {
          id: "conta",
          messaging: [
            { sender: { id: "ig-2" }, message: { mid: "m1", text: "oi" } },
          ],
        },
      ],
    };
    const eventos = normalizar(payloadWebhook.parse(bruto));
    expect(eventos).toHaveLength(2);
    expect(eventos.find((e) => e.tipo === "comentario")?.idExterno).toBe("c1");
    expect(eventos.find((e) => e.tipo === "mensagem")?.idExterno).toBe("m1");
  });

  it("descarta echo das nossas proprias mensagens", () => {
    const bruto = {
      object: "instagram",
      entry: [
        {
          messaging: [
            { sender: { id: "conta" }, message: { mid: "m1", text: "eco", is_echo: true } },
          ],
        },
      ],
    };
    expect(normalizar(payloadWebhook.parse(bruto))).toHaveLength(0);
  });

  it("descarta comentario da propria conta", () => {
    const bruto = {
      object: "instagram",
      entry: [
        {
          changes: [
            {
              field: "comments",
              value: { id: "c9", text: "RELATORIO", from: { id: "conta-do-negocio" } },
            },
          ],
        },
      ],
    };
    expect(normalizar(payloadWebhook.parse(bruto), "conta-do-negocio")).toHaveLength(0);
  });

  it("ignora campo que nao acompanhamos e sobrevive a chave nova", () => {
    const bruto = {
      object: "instagram",
      entry: [
        {
          changes: [
            { field: "mentions", value: { id: "x" } },
            {
              field: "comments",
              value: {
                id: "c2",
                text: "PRINT",
                from: { id: "ig-3", username: "outra" },
                campo_novo_que_a_meta_inventou: true,
              },
            },
          ],
        },
      ],
    };
    const eventos = normalizar(payloadWebhook.parse(bruto));
    expect(eventos).toHaveLength(1);
    expect(eventos[0]!.idExterno).toBe("c2");
  });
});

describe("casamento de palavra-chave", () => {
  const palavras = ["RELATORIO", "PRINT", "EU"];

  it("casa sem acento, sem caixa e com pontuacao em volta", () => {
    expect(palavraChaveDo("relatório!", palavras)).toBe("RELATORIO");
    expect(palavraChaveDo("quero o PRINT, por favor", palavras)).toBe("PRINT");
    expect(palavraChaveDo("eu", palavras)).toBe("EU");
  });

  it("exige palavra inteira", () => {
    expect(palavraChaveDo("relatorios", palavras)).toBeUndefined();
    expect(palavraChaveDo("printer", palavras)).toBeUndefined();
    expect(palavraChaveDo("europa", palavras)).toBeUndefined();
  });

  it("devolve undefined quando nao tem nada", () => {
    expect(palavraChaveDo("parabens pelo post", palavras)).toBeUndefined();
  });
});
