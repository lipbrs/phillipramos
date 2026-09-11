import { statSync } from "node:fs";

import { closeDb } from "../src/db/client.ts";
import { QUANTOS_GUARDAR, fazerBackup, limparAntigos } from "../src/db/backup.ts";

const destino = process.argv[2] ?? "backups";

const arquivo = await fazerBackup(destino);
const kb = Math.round(statSync(arquivo).size / 1024);
console.log(`backup: ${arquivo} (${kb} kB)`);

const apagados = limparAntigos(destino);
if (apagados.length > 0) {
  console.log(`apagados ${apagados.length} antigos (guardando ${QUANTOS_GUARDAR})`);
}

console.log(
  "Guarde uma cópia FORA desta pasta. Backup que mora no mesmo disco do banco " +
    "não é backup — é uma segunda chance de perder tudo junto.",
);

closeDb();
