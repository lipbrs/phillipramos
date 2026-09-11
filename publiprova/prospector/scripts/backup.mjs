import { spawnSync } from "node:child_process";

/**
 * Backup pela linha de comando: `pnpm backup`.
 *
 * Roda o .ts pelo próprio Node para não precisar de build. Agende no Agendador
 * de Tarefas do Windows (ou cron) uma vez por dia — o SETUP, seção 10, explica.
 */

const r = spawnSync(
  process.execPath,
  ["--env-file=.env", "--experimental-strip-types", "scripts/backup-impl.ts"],
  { stdio: "inherit" },
);
process.exit(r.status ?? 1);
