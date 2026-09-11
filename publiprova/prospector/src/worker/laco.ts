import { eq } from "drizzle-orm";

import { db } from "../db/client.ts";
import { jobs } from "../db/schema.ts";
import {
  SistemaPausado,
  estadoDaPausa,
  registrarErro,
  registrarExcecao,
  registrarSucesso,
} from "../lib/seguranca.ts";
import { ehDefinitivo, executar, type Contexto, type Resultado } from "./executor.ts";
import { concluir, falhar, pegarProxima, recuperarOrfas } from "./fila.ts";

/**
 * O laco do worker.
 *
 * Uma rodada = uma job. E separado do laco continuo de proposito: teste e
 * painel rodam `umaRodada()` sem precisar de timer, e o `main.ts` so repete.
 */

export type Rodada =
  | { tipo: "vazio" }
  | { tipo: "pausado"; motivo: string }
  | { tipo: "feita"; jobId: number; resultado: Resultado }
  | { tipo: "falhou"; jobId: number; erro: string; destino: "retry" | "dead" };

export async function umaRodada(ctx: Contexto): Promise<Rodada> {
  const pausa = await estadoDaPausa();
  if (pausa.pausado) {
    return { tipo: "pausado", motivo: `${pausa.motivo ?? "manual"}: ${pausa.detalhe ?? ""}` };
  }

  const job = await pegarProxima();
  if (!job) return { tipo: "vazio" };

  try {
    const resultado = await executar(job, ctx);

    if (resultado.tipo === "adiado") {
      // Adiar nao e falha: nao gasta tentativa nem conta para o breaker.
      await db
        .update(jobs)
        .set({
          status: "pending",
          lockedAt: null,
          runAt: resultado.ate.toISOString(),
          attempts: job.attempts - 1,
        })
        .where(eq(jobs.id, job.id));
      return { tipo: "feita", jobId: job.id, resultado };
    }

    await concluir(job.id);
    await registrarSucesso();
    return { tipo: "feita", jobId: job.id, resultado };
  } catch (erro) {
    // Pausa geral que apareceu no meio da job: devolve a job intacta e sai.
    if (erro instanceof SistemaPausado) {
      await db
        .update(jobs)
        .set({ status: "pending", lockedAt: null, attempts: job.attempts - 1 })
        .where(eq(jobs.id, job.id));
      return { tipo: "pausado", motivo: erro.message };
    }

    const mensagem = erro instanceof Error ? erro.message : String(erro);

    // Erro que nao adianta repetir (token errado, janela fechada) nao volta
    // para a fila: vira excecao para um humano olhar.
    if (ehDefinitivo(erro)) {
      await db
        .update(jobs)
        .set({ status: "dead", lastError: mensagem, lockedAt: null })
        .where(eq(jobs.id, job.id));
      await registrarExcecao({
        kind: "envio_recusado",
        detail: `job ${job.id} (${job.kind}): ${mensagem}`,
      });
      await registrarErro(mensagem);
      return { tipo: "falhou", jobId: job.id, erro: mensagem, destino: "dead" };
    }

    const destino = await falhar(job, erro);
    await registrarErro(mensagem);
    return { tipo: "falhou", jobId: job.id, erro: mensagem, destino };
  }
}

export type OpcoesDoLaco = {
  /** Espera entre rodadas quando a fila esta vazia. */
  intervaloVazioMs?: number;
  /** Espera entre rodadas quando o sistema esta pausado. */
  intervaloPausadoMs?: number;
  /** Para o laco. Usado pelo sinal de desligar e pelos testes. */
  parar?: () => boolean;
  aoRodar?: (r: Rodada) => void;
};

export async function rodarLaco(ctx: Contexto, opcoes: OpcoesDoLaco = {}): Promise<void> {
  const vazio = opcoes.intervaloVazioMs ?? 5_000;
  const pausado = opcoes.intervaloPausadoMs ?? 30_000;
  const parar = opcoes.parar ?? (() => false);

  const devolvidas = await recuperarOrfas();
  if (devolvidas > 0) {
    console.log(`[worker] ${devolvidas} job(s) presas voltaram para a fila`);
  }

  while (!parar()) {
    const rodada = await umaRodada(ctx);
    opcoes.aoRodar?.(rodada);

    if (rodada.tipo === "vazio") {
      await dormir(vazio, parar);
    } else if (rodada.tipo === "pausado") {
      await dormir(pausado, parar);
    }
  }
}

/** Dorme em fatias para o desligamento nao esperar o intervalo inteiro. */
async function dormir(ms: number, parar: () => boolean): Promise<void> {
  const fatia = 250;
  for (let passado = 0; passado < ms && !parar(); passado += fatia) {
    await new Promise((r) => setTimeout(r, Math.min(fatia, ms - passado)));
  }
}
