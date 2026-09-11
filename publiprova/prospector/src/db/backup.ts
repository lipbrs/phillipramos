import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { client } from "./client.ts";

/**
 * Backup do banco.
 *
 * `VACUUM INTO` copia com o sistema rodando e sai com um arquivo consistente —
 * copiar o `.db` com `cp` enquanto o worker escreve produz um arquivo que
 * *parece* certo e falha quando você mais precisa dele, porque o WAL fica para
 * trás.
 *
 * Restaurar é trocar o arquivo com o sistema parado. Não tem função para isso
 * aqui de propósito: restauração automática é como se apaga um dia de trabalho
 * sem querer. O procedimento está no SETUP, seção 10, e o teste deste arquivo
 * executa a restauração de verdade para provar que o backup presta.
 */

/** Backups mais novos que isto ficam; o resto sai. */
export const QUANTOS_GUARDAR = 14;

export function caminhoDoBackup(dir: string, agora = new Date()): string {
  const carimbo = agora.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return resolve(dir, `prospector-${carimbo}.db`);
}

export async function fazerBackup(dir = "backups", agora = new Date()): Promise<string> {
  mkdirSync(dir, { recursive: true });
  const destino = caminhoDoBackup(dir, agora);

  // O caminho vai literal no SQL, entao aspas simples dentro dele quebrariam a
  // instrucao. Nome gerado por nos nunca tem, mas o diretorio vem de fora.
  if (destino.includes("'")) {
    throw new Error(`caminho de backup com aspas simples nao e aceito: ${destino}`);
  }

  await client.execute(`VACUUM INTO '${destino.replace(/\\/g, "/")}'`);

  const tamanho = statSync(destino).size;
  if (tamanho === 0) throw new Error(`backup saiu vazio: ${destino}`);

  return destino;
}

/** Apaga os mais antigos, mantendo os `QUANTOS_GUARDAR` mais recentes. */
export function limparAntigos(dir = "backups", quantos = QUANTOS_GUARDAR): string[] {
  let arquivos: string[];
  try {
    arquivos = readdirSync(dir).filter((f) => f.startsWith("prospector-") && f.endsWith(".db"));
  } catch {
    return [];
  }

  // O nome carrega a data em ISO, entao ordem alfabetica e ordem cronologica.
  const apagar = arquivos.sort().slice(0, Math.max(0, arquivos.length - quantos));
  for (const f of apagar) rmSync(resolve(dir, f), { force: true });
  return apagar;
}
