// Sem "server-only" aqui: o worker e um processo Node comum e importa este
// mesmo cliente. O "server-only" fica na camada de consulta do Next, nao aqui.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "../lib/env.ts";
import * as schema from "./schema.ts";

/**
 * libsql e SQLite: DATABASE_URL e um caminho `file:` em disco. WAL e busy
 * timeout sao ligados uma vez aqui para todo mundo herdar — sem WAL, o worker e
 * o painel se bloqueiam na primeira escrita concorrente.
 */
const client = createClient({ url: env.DATABASE_URL });

let pragmasApplied = false;

export async function applyPragmas(): Promise<void> {
  if (pragmasApplied) return;
  await client.execute("PRAGMA journal_mode = WAL");
  await client.execute("PRAGMA foreign_keys = ON");
  await client.execute("PRAGMA busy_timeout = 5000");
  pragmasApplied = true;
}

export const db = drizzle(client, { schema });
export { client, schema };

/** O Windows trava o arquivo enquanto a conexao vive; o teste precisa fechar. */
export function closeDb(): void {
  client.close();
}
