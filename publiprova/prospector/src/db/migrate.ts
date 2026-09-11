import { migrate } from "drizzle-orm/libsql/migrator";

import { applyPragmas, db } from "./client.ts";

export async function runMigrations(folder = "./drizzle"): Promise<void> {
  await applyPragmas();
  await migrate(db, { migrationsFolder: folder });
}

// Execucao direta: node --experimental-strip-types src/db/migrate.ts
if (process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(() => {
      console.log("migracoes aplicadas");
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error("falha na migracao:", err);
      process.exit(1);
    });
}
