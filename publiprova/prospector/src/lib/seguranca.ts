import { eq } from "drizzle-orm";

import { db } from "../db/client.ts";
import { exceptions, systemState } from "../db/schema.ts";

/**
 * Pausa geral e circuit breakers.
 *
 * A regra aqui e uma so: na duvida, para. Retomar e um clique; mandar mensagem
 * errada para uma agencia real nao tem desfazer, e a conta em risco e a unica
 * que o negocio tem.
 */

export const MOTIVOS_DE_PAUSA = [
  "manual",
  "orcamento_estourado",
  "erro_em_sequencia",
  "sessao_perdida",
  "restricao_do_instagram",
  "envio_duplicado",
  "divergencia_de_estado",
  "aumento_de_opt_out",
  "comportamento_inesperado_da_ia",
] as const;

export type MotivoDePausa = (typeof MOTIVOS_DE_PAUSA)[number];

export type Pausa = {
  pausado: boolean;
  motivo?: MotivoDePausa;
  detalhe?: string;
  desde?: string;
};

const CHAVE_PAUSA = "pausa_geral";
const CHAVE_ERROS = "erros_em_sequencia";

/** Erros seguidos antes de o circuit breaker abrir. */
export const LIMITE_DE_ERROS = 5;

export async function estadoDaPausa(): Promise<Pausa> {
  const [linha] = await db
    .select()
    .from(systemState)
    .where(eq(systemState.key, CHAVE_PAUSA))
    .limit(1);
  if (!linha) return { pausado: false };
  return linha.value as Pausa;
}

export async function pausar(motivo: MotivoDePausa, detalhe: string): Promise<void> {
  const valor: Pausa = { pausado: true, motivo, detalhe, desde: new Date().toISOString() };
  await db
    .insert(systemState)
    .values({ key: CHAVE_PAUSA, value: valor })
    .onConflictDoUpdate({
      target: systemState.key,
      set: { value: valor, updatedAt: new Date().toISOString() },
    });
  await db.insert(exceptions).values({
    kind: `pausa:${motivo}`,
    detail: detalhe,
  });
}

export async function retomar(): Promise<void> {
  const valor: Pausa = { pausado: false };
  await db
    .insert(systemState)
    .values({ key: CHAVE_PAUSA, value: valor })
    .onConflictDoUpdate({
      target: systemState.key,
      set: { value: valor, updatedAt: new Date().toISOString() },
    });
  await zerarErros();
}

export class SistemaPausado extends Error {
  constructor(readonly pausa: Pausa) {
    super(`Sistema pausado (${pausa.motivo ?? "sem motivo"}): ${pausa.detalhe ?? ""}`);
    this.name = "SistemaPausado";
  }
}

/** Chamada antes de qualquer acao que saia para o mundo. */
export async function exigirSistemaAtivo(): Promise<void> {
  const pausa = await estadoDaPausa();
  if (pausa.pausado) throw new SistemaPausado(pausa);
}

async function lerErros(): Promise<number> {
  const [linha] = await db
    .select()
    .from(systemState)
    .where(eq(systemState.key, CHAVE_ERROS))
    .limit(1);
  return linha ? Number((linha.value as { total: number }).total ?? 0) : 0;
}

async function gravarErros(total: number): Promise<void> {
  await db
    .insert(systemState)
    .values({ key: CHAVE_ERROS, value: { total } })
    .onConflictDoUpdate({
      target: systemState.key,
      set: { value: { total }, updatedAt: new Date().toISOString() },
    });
}

export async function zerarErros(): Promise<void> {
  await gravarErros(0);
}

/**
 * Conta erro consecutivo. Ao bater o limite, pausa o sistema — e o que impede
 * uma integracao fora do ar de virar centenas de tentativas e de linhas de log.
 */
export async function registrarErro(detalhe: string): Promise<{ total: number; pausou: boolean }> {
  const total = (await lerErros()) + 1;
  await gravarErros(total);

  if (total >= LIMITE_DE_ERROS) {
    await pausar("erro_em_sequencia", `${total} erros seguidos. Ultimo: ${detalhe}`);
    return { total, pausou: true };
  }
  return { total, pausou: false };
}

export async function registrarSucesso(): Promise<void> {
  if ((await lerErros()) > 0) await zerarErros();
}

export async function registrarExcecao(input: {
  leadId?: number | null;
  kind: string;
  detail: string;
}): Promise<void> {
  await db.insert(exceptions).values({
    leadId: input.leadId ?? null,
    kind: input.kind,
    detail: input.detail,
  });
}

export async function excecoesAbertas(): Promise<(typeof exceptions.$inferSelect)[]> {
  const { isNull } = await import("drizzle-orm");
  return db.select().from(exceptions).where(isNull(exceptions.resolvedAt));
}

/**
 * Horario de operacao. Fora da janela nada e enviado — nao por disfarce, mas
 * porque mensagem comercial as 3 da manha e ruim para quem recebe.
 */
export function dentroDoHorario(
  janela: string,
  fuso: string,
  agora: Date = new Date(),
): boolean {
  const [inicio, fim] = janela.split("-");
  if (!inicio || !fim) return true;

  const formatador = new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const local = formatador.format(agora);
  return local >= inicio && local <= fim;
}
