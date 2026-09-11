// NOTE: no "server-only" here — the worker is a plain Node process and imports
// this too. "server-only" belongs in the Next query layer, not the shared client.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "../lib/env.ts";
import * as schema from "./schema.ts";

/**
 * libsql is SQLite: DATABASE_URL is a `file:` path on disk. WAL and a busy
 * timeout are set once here so every caller inherits them — without WAL the
 * worker and the dashboard block each other on the first concurrent write.
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

/** Windows keeps the file locked while the connection lives — tests must close it. */
export function closeDb(): void {
  client.close();
}
