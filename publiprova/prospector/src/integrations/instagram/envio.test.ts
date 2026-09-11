import { describe, expect, it } from "vitest";

import { FalhaDeEnvio, remetenteMeta, remetenteSimulado } from "./envio.ts";

function fetchDeMentira(
  responder: (url: string, init: RequestInit) => { status: number; corpo: string },
) {
  const chamadas: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    chamadas.push({ url: u, init: init ?? {} });
    const { status, corpo } = responder(u, init ?? {});
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => corpo,
    } as Response;
  }) as unknown as typeof globalThis.fetch;
  return { fn, chamadas };
}

const deps = (fetch: typeof globalThis.fetch) => ({
  token: "TOKEN_FALSO",
  contaId: "17841400000000000",
  fetch,
});

describe("remetente simulado", () => {
  it("nao sai da maquina e marca o resultado como simulado", async () => {
    const r = await remetenteSimulado().enviar({
      tipo: "private_reply",
      comentarioId: "c1",
      texto: "oi",
    });
    expect(r.simulado).toBe(true);
    expect(r.externalId.startsWith("simulado:")).toBe(true);
  });

  it("o mesmo envio devolve o mesmo id — a duplicata colide no unique", async () => {
    const rem = remetenteSimulado();
    const a = await rem.enviar({ tipo: "api_dm", igUserId: "u1", texto: "oi" });
    const b = await rem.enviar({ tipo: "api_dm", igUserId: "u1", texto: "oi" });
    const c = await rem.enviar({ tipo: "api_dm", igUserId: "u1", texto: "outro" });
    expect(b.externalId).toBe(a.externalId);
    expect(c.externalId).not.toBe(a.externalId);
  });
});

describe("cliente da API oficial", () => {
  it("resposta privada manda comment_id; DM manda id", async () => {
    const { fn, chamadas } = fetchDeMentira(() => ({
      status: 200,
      corpo: JSON.stringify({ message_id: "mid.abc" }),
    }));
    const rem = remetenteMeta(deps(fn));

    await rem.enviar({ tipo: "private_reply", comentarioId: "c9", texto: "oi" });
    await rem.enviar({ tipo: "api_dm", igUserId: "u9", texto: "oi" });

    const primeiro = JSON.parse(String(chamadas[0]!.init.body));
    const segundo = JSON.parse(String(chamadas[1]!.init.body));
    expect(primeiro.recipient).toEqual({ comment_id: "c9" });
    expect(segundo.recipient).toEqual({ id: "u9" });
    expect(primeiro.message).toEqual({ text: "oi" });
  });

  it("bate no endpoint de mensagens da conta, com o token no cabecalho", async () => {
    const { fn, chamadas } = fetchDeMentira(() => ({
      status: 200,
      corpo: JSON.stringify({ message_id: "mid.abc" }),
    }));
    await remetenteMeta(deps(fn)).enviar({ tipo: "api_dm", igUserId: "u1", texto: "oi" });

    expect(chamadas[0]!.url).toBe(
      "https://graph.instagram.com/v23.0/17841400000000000/messages",
    );
    const headers = chamadas[0]!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer TOKEN_FALSO");
  });

  it("devolve o message_id da Meta — e ele que trava a duplicata", async () => {
    const { fn } = fetchDeMentira(() => ({
      status: 200,
      corpo: JSON.stringify({ recipient_id: "u1", message_id: "mid.xyz" }),
    }));
    const r = await remetenteMeta(deps(fn)).enviar({
      tipo: "api_dm",
      igUserId: "u1",
      texto: "oi",
    });
    expect(r).toEqual({ externalId: "mid.xyz", simulado: false });
  });

  it("200 sem message_id nao passa por sucesso", async () => {
    const { fn } = fetchDeMentira(() => ({ status: 200, corpo: "{}" }));
    await expect(
      remetenteMeta(deps(fn)).enviar({ tipo: "api_dm", igUserId: "u1", texto: "oi" }),
    ).rejects.toThrow(/sem message_id/);
  });

  it("erro nosso nao e retentavel; erro deles e", async () => {
    const casos: [number, boolean][] = [
      [400, false],
      [403, false],
      [429, true],
      [500, true],
      [503, true],
    ];
    for (const [status, retentavel] of casos) {
      const { fn } = fetchDeMentira(() => ({ status, corpo: '{"error":{}}' }));
      const erro = await remetenteMeta(deps(fn))
        .enviar({ tipo: "api_dm", igUserId: "u1", texto: "oi" })
        .catch((e: unknown) => e);
      expect(erro, String(status)).toBeInstanceOf(FalhaDeEnvio);
      expect((erro as FalhaDeEnvio).retentavel, String(status)).toBe(retentavel);
    }
  });
});
