"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "../src/db/client.ts";
import { exceptions } from "../src/db/schema.ts";
import { pausar, retomar } from "../src/lib/seguranca.ts";

/**
 * As duas unicas acoes que o painel faz. Escrever mensagem daqui seria um
 * caminho de envio que nao passa pelo worker — e pelas travas dele.
 */

export async function pausarTudo(formData: FormData): Promise<void> {
  const motivo = String(formData.get("motivo") ?? "pelo painel");
  await pausar("manual", motivo);
  revalidatePath("/");
}

export async function retomarTudo(): Promise<void> {
  await retomar();
  revalidatePath("/");
}

export async function resolverExcecao(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db
    .update(exceptions)
    .set({ resolvedAt: new Date().toISOString() })
    .where(eq(exceptions.id, id));
  revalidatePath("/excecoes");
  revalidatePath("/");
}
