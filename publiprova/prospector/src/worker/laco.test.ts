import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "prospector-laco-"));
process.env.DATABASE_URL = `file:${join(dir, "laco.db").replace(/\\/g, "/")}`;
process.env.DRY_RUN = "true";
process.env.OPERATING_HOURS = "00:00-23:59";
process.env.MAX_DMS_PER_DAY = "30";

type Entrada = typeof import("../features/conversations/entrada.ts");
type Laco = typeof import("./laco.ts");
type Envio = typeof import("../integrations/instagram/envio.ts");
type Repo = typeof import("../features/leads/repository.ts");
type Seguranca = typeof import("../lib/seguranca.ts");
type Fila = typeof import("./fila.ts");

let entrada: Entrada;
let laco: Laco;
let envio: Envio;
let repo: Repo;
let seguranca: Seguranca;
let fila: Fila;

beforeAll(async () => {
  const { runMigrations } = await import("../db/migrate.ts");
  await runMigrations();
  entrada = await import("../features/conversations/entrada.ts");
  laco = await import("./laco.ts");
  envio = await import("../integrations/instagram/envio.ts");
  repo = await import("../features/leads/repository.ts");
  seguranca = await import("../lib/seguranca.ts");
  fila = await import("./fila.ts");
});

afterAll(async () => {
  const { closeDb } = await import("../db/client.ts");
  closeDb();
});

beforeEach(async () => {
  await seguranca.retomar();
  // A fila e do banco, nao do teste: sem limpar, uma rodada pegaria a job mais
  // antiga — a que o teste anterior deixou — e o teste passaria pelo motivo
  // errado.
  const { db } = await import("../db/client.ts");
  const { exceptions, jobs } = await import("../db/schema.ts");
  await db.delete(jobs);
  await db.delete(exceptions);
});

let contador = 0;
function comentario(palavra: string, quem = "agencia.teste") {
  contador += 1;
  return {
    tipo: "comentario" as const,
    idExterno: `c${contador}`,
    igUserId: `ig${contador}`,
    username: `${quem}.${contador}`,
    texto: `${palavra} quero ver`,
    postId: "post_1",
  };
}

/** Remetente que registra o que passou por ele, para o teste poder olhar. */
function espiao() {
  const enviados: unknown[] = [];
  const base = envio.remetenteSimulado();
  return {
    enviados,
    remetente: {
      async enviar(e: Parameters<typeof base.enviar>[0]) {
        enviados.push(e);
        return base.enviar(e);
      },
    },
  };
}

describe("fluxo completo: comentario vira resposta privada", () => {
  it("entrega o que o post prometeu e move canal e etapa", async () => {
    const { enviados, remetente } = espiao();
    const r = await entrada.processarEvento(comentario("RELATORIO"));
    expect(r.acao).toBe("lead_criado");

    const rodada = await laco.umaRodada({ remetente });
    expect(rodada.tipo).toBe("feita");
    if (rodada.tipo !== "feita") return;
    expect(rodada.resultado.tipo).toBe("enviado");

    // O texto entregue e o link da demonstracao, que e o que o post promete.
    expect(enviados).toHaveLength(1);
    const enviado = enviados[0] as { tipo: string; texto: string };
    expect(enviado.tipo).toBe("private_reply");
    expect(enviado.texto).toContain("publiprova-plan-b1a5.vercel.app/login");

    if (rodada.resultado.tipo !== "enviado") return;
    const lead = await repo.getLead(rodada.resultado.leadId);
    expect(lead.channelState).toBe("private_reply_sent");
    expect(lead.stage).toBe("contacted");
    expect(rodada.resultado.simulado).toBe(true);
  });

  it("PRINT entrega as tres mensagens na propria DM, sem link", async () => {
    const { enviados, remetente } = espiao();
    await entrada.processarEvento(comentario("PRINT"));
    await laco.umaRodada({ remetente });

    const enviado = enviados[0] as { texto: string };
    expect(enviado.texto).toContain("Na véspera");
    expect(enviado.texto).not.toContain("http");
  });

  it("EU convida para a pesquisa, sem pitch", async () => {
    const { enviados, remetente } = espiao();
    await entrada.processarEvento(comentario("EU"));
    await laco.umaRodada({ remetente });

    const enviado = enviados[0] as { texto: string };
    expect(enviado.texto).toContain("6 perguntas");
    expect(enviado.texto).toContain("Sem pitch");
    // O texto sai acentuado: quem le e uma agencia, nao o compilador.
    expect(enviado.texto).toContain("agências");
  });
});

describe("o que impede o envio errado", () => {
  it("comentar duas vezes nao manda duas respostas", async () => {
    const { enviados, remetente } = espiao();
    const c = comentario("RELATORIO");

    await entrada.processarEvento(c);
    await entrada.processarEvento(c); // webhook repetiu
    // Segundo comentario do mesmo lead, com id diferente.
    await entrada.processarEvento({ ...c, idExterno: `${c.idExterno}b` });

    for (let i = 0; i < 4; i += 1) await laco.umaRodada({ remetente });

    expect(enviados).toHaveLength(1);
  });

  it("quem pediu para parar nao recebe, mesmo com job na fila", async () => {
    const { enviados, remetente } = espiao();
    const r = await entrada.processarEvento(comentario("RELATORIO"));
    if (r.acao !== "lead_criado") throw new Error("esperava lead novo");

    await repo.markDoNotContact(r.leadId, "teste");
    const rodada = await laco.umaRodada({ remetente });

    expect(rodada.tipo).toBe("feita");
    if (rodada.tipo === "feita") expect(rodada.resultado.tipo).toBe("ignorado");
    expect(enviados).toHaveLength(0);
  });

  it("sistema pausado nao consome a fila", async () => {
    const { enviados, remetente } = espiao();
    await entrada.processarEvento(comentario("RELATORIO"));
    await seguranca.pausar("manual", "teste");

    const rodada = await laco.umaRodada({ remetente });
    expect(rodada.tipo).toBe("pausado");
    expect(enviados).toHaveLength(0);

    // A job continua na fila, intacta.
    await seguranca.retomar();
    const depois = await laco.umaRodada({ remetente });
    expect(depois.tipo).toBe("feita");
    expect(enviados).toHaveLength(1);
  });

  it("fora do horario a job e adiada, nao perdida nem contada como tentativa", async () => {
    const { enviados, remetente } = espiao();
    await entrada.processarEvento(comentario("RELATORIO"));

    // Meia-noite e um: fora de qualquer janela comercial.
    const madrugada = new Date();
    madrugada.setHours(3, 0, 0, 0);
    process.env.OPERATING_HOURS = "09:00-20:00";
    const env = await import("../lib/env.ts");
    const janelaOriginal = env.env.OPERATING_HOURS;
    (env.env as { OPERATING_HOURS: string }).OPERATING_HOURS = "09:00-20:00";

    try {
      const rodada = await laco.umaRodada({ remetente, agora: madrugada });
      expect(rodada.tipo).toBe("feita");
      if (rodada.tipo === "feita") {
        expect(rodada.resultado.tipo).toBe("adiado");
        if (rodada.resultado.tipo === "adiado") {
          expect(rodada.resultado.ate.getHours()).toBe(9);
        }
      }
      expect(enviados).toHaveLength(0);

      const status = await fila.contarPorStatus();
      expect(status.pending ?? 0).toBeGreaterThan(0);
    } finally {
      (env.env as { OPERATING_HOURS: string }).OPERATING_HOURS = janelaOriginal;
      process.env.OPERATING_HOURS = "00:00-23:59";
    }
  });

  it("teto diario adia em vez de estourar a conta", async () => {
    const { enviados, remetente } = espiao();
    await entrada.processarEvento(comentario("RELATORIO"));

    const env = await import("../lib/env.ts");
    const tetoOriginal = env.env.MAX_DMS_PER_DAY;
    (env.env as { MAX_DMS_PER_DAY: number }).MAX_DMS_PER_DAY = 0;

    try {
      const rodada = await laco.umaRodada({ remetente });
      expect(rodada.tipo).toBe("feita");
      if (rodada.tipo === "feita") expect(rodada.resultado.tipo).toBe("adiado");
      expect(enviados).toHaveLength(0);
    } finally {
      // Sem o finally, uma falha aqui deixaria o teto em 0 e derrubaria todos
      // os testes seguintes por outro motivo.
      (env.env as { MAX_DMS_PER_DAY: number }).MAX_DMS_PER_DAY = tetoOriginal;
    }
  });

  it("resposta do lead vai para humano enquanto nao houver classificador", async () => {
    const { enviados, remetente } = espiao();
    contador += 1;
    await entrada.processarEvento({
      tipo: "mensagem",
      idExterno: `m${contador}`,
      igUserId: `igm${contador}`,
      texto: "legal, como funciona a cobranca?",
    });

    const rodada = await laco.umaRodada({ remetente });
    expect(rodada.tipo).toBe("feita");
    if (rodada.tipo === "feita") expect(rodada.resultado.tipo).toBe("escalado");
    expect(enviados).toHaveLength(0);

    const abertas = await seguranca.excecoesAbertas();
    expect(abertas.some((e) => e.kind === "precisa_de_humano")).toBe(true);
  });
});

describe("erro de envio", () => {
  it("erro definitivo mata a job e abre excecao, sem repetir", async () => {
    await entrada.processarEvento(comentario("RELATORIO"));
    const remetente = {
      async enviar() {
        throw new envio.FalhaDeEnvio(400, '{"error":{"message":"janela fechada"}}', false);
      },
    };

    const rodada = await laco.umaRodada({ remetente });
    expect(rodada.tipo).toBe("falhou");
    if (rodada.tipo === "falhou") expect(rodada.destino).toBe("dead");

    const abertas = await seguranca.excecoesAbertas();
    expect(abertas.some((e) => e.kind === "envio_recusado")).toBe(true);
  });

  it("erro passageiro volta para a fila com espera", async () => {
    await entrada.processarEvento(comentario("RELATORIO"));
    const remetente = {
      async enviar() {
        throw new envio.FalhaDeEnvio(503, "indisponivel", true);
      },
    };

    const rodada = await laco.umaRodada({ remetente });
    expect(rodada.tipo).toBe("falhou");
    if (rodada.tipo === "falhou") expect(rodada.destino).toBe("retry");
  });

  it("cinco erros seguidos pausam o sistema sozinho", async () => {
    await seguranca.retomar();
    const remetente = {
      async enviar() {
        throw new envio.FalhaDeEnvio(503, "indisponivel", true);
      },
    };

    for (let i = 0; i < seguranca.LIMITE_DE_ERROS; i += 1) {
      await entrada.processarEvento(comentario("RELATORIO"));
      await laco.umaRodada({ remetente });
    }

    const pausa = await seguranca.estadoDaPausa();
    expect(pausa.pausado).toBe(true);
    expect(pausa.motivo).toBe("erro_em_sequencia");
  });
});
