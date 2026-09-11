import { z } from "zod";

/**
 * Formatos que a Meta manda no webhook do Instagram.
 *
 * Os schemas sao deliberadamente frouxos onde nao usamos o campo: a Meta
 * acrescenta chave nova sem avisar, e um schema estrito viraria fila de excecao
 * cheia de evento legitimo. O que usamos, exigimos.
 */

const comentario = z.object({
  id: z.string().min(1),
  text: z.string().default(""),
  from: z.object({ id: z.string().min(1), username: z.string().optional() }).optional(),
  media: z.object({ id: z.string().min(1) }).partial().optional(),
  /** Comentario nosso respondendo alguem tambem dispara webhook — ignoramos. */
  parent_id: z.string().optional(),
});

const mudanca = z.object({
  field: z.string(),
  value: z.unknown(),
});

const entrada = z.object({
  id: z.string().optional(),
  time: z.number().optional(),
  changes: z.array(mudanca).optional(),
  messaging: z
    .array(
      z.object({
        sender: z.object({ id: z.string().min(1) }),
        recipient: z.object({ id: z.string().min(1) }).optional(),
        timestamp: z.number().optional(),
        message: z
          .object({
            mid: z.string().min(1),
            text: z.string().optional(),
            is_echo: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export const payloadWebhook = z.object({
  object: z.string(),
  entry: z.array(entrada).default([]),
});

export type PayloadWebhook = z.infer<typeof payloadWebhook>;

/** Evento ja normalizado, que e o que o resto do sistema consome. */
export type EventoNormalizado =
  | {
      tipo: "comentario";
      /** Chave de idempotencia: id do comentario na Meta. */
      idExterno: string;
      igUserId: string;
      username?: string;
      texto: string;
      postId?: string;
    }
  | {
      tipo: "mensagem";
      /** Chave de idempotencia: mid da mensagem na Meta. */
      idExterno: string;
      igUserId: string;
      texto: string;
    };

/**
 * Achata o payload em eventos que interessam. Descarta:
 * - echo (mensagem que nos mesmos enviamos, devolvida pelo webhook);
 * - resposta a comentario feita pela propria conta;
 * - mudanca de campo que nao acompanhamos.
 */
export function normalizar(
  payload: PayloadWebhook,
  idDaContaDoNegocio?: string,
): EventoNormalizado[] {
  const saida: EventoNormalizado[] = [];

  for (const e of payload.entry) {
    for (const m of e.messaging ?? []) {
      if (!m.message || m.message.is_echo) continue;
      if (idDaContaDoNegocio && m.sender.id === idDaContaDoNegocio) continue;
      const texto = m.message.text?.trim();
      if (!texto) continue;
      saida.push({
        tipo: "mensagem",
        idExterno: m.message.mid,
        igUserId: m.sender.id,
        texto,
      });
    }

    for (const c of e.changes ?? []) {
      if (c.field !== "comments") continue;
      const parsed = comentario.safeParse(c.value);
      if (!parsed.success) continue;
      const v = parsed.data;
      if (!v.from?.id) continue;
      if (idDaContaDoNegocio && v.from.id === idDaContaDoNegocio) continue;
      saida.push({
        tipo: "comentario",
        idExterno: v.id,
        igUserId: v.from.id,
        username: v.from.username,
        texto: v.text,
        postId: v.media?.id,
      });
    }
  }

  return saida;
}

/**
 * Descobre qual palavra-chave o comentario disparou. Compara sem acento e sem
 * caixa, e exige palavra inteira — "relatorios" nao dispara "RELATORIO", senao
 * qualquer frase com o radical viraria lead.
 */
export function palavraChaveDo(texto: string, palavras: string[]): string | undefined {
  const limpo = normalizarTexto(texto);
  for (const palavra of palavras) {
    const alvo = normalizarTexto(palavra);
    if (!alvo) continue;
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaparRegex(alvo)}([^\\p{L}\\p{N}]|$)`, "u");
    if (regex.test(limpo)) return palavra;
  }
  return undefined;
}

function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
