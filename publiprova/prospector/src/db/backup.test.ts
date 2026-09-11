import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "prospector-backup-"));
const arquivoDoBanco = join(dir, "prospector.db");
const pastaDeBackup = join(dir, "backups");
process.env.DATABASE_URL = `file:${arquivoDoBanco.replace(/\\/g, "/")}`;

type Backup = typeof import("./backup.ts");
type Repo = typeof import("../features/leads/repository.ts");

let backup: Backup;
let repo: Repo;

beforeAll(async () => {
  const { runMigrations } = await import("./migrate.ts");
  await runMigrations();
  backup = await import("./backup.ts");
  repo = await import("../features/leads/repository.ts");
});

afterAll(async () => {
  const { closeDb } = await import("./client.ts");
  closeDb();
});

describe("backup e restauracao", () => {
  it("o backup guarda os dados e da para abrir e ler deles", async () => {
    await repo.discoverLead({
      handle: "agencia.antes.do.backup",
      funnel: "customer",
      source: "manual",
    });

    const arquivo = await backup.fazerBackup(pastaDeBackup);
    expect(existsSync(arquivo)).toBe(true);

    // Depois do backup entra um lead que o backup nao pode ter.
    await repo.discoverLead({
      handle: "agencia.depois.do.backup",
      funnel: "customer",
      source: "manual",
    });

    // Restaurar e por o arquivo de backup no lugar e abrir. Aqui ele vai para
    // um caminho novo, e nao por cima do banco vivo, porque no Windows o libsql
    // segura o arquivo enquanto o processo existe — `closeDb()` nao solta. Na
    // restauracao de verdade o processo esta parado; e por isso que a secao 10
    // do SETUP manda PARAR o sistema, nao so fechar o painel.
    const restauradoEm = join(dir, "restaurado.db");
    copyFileSync(arquivo, restauradoEm);

    const { createClient } = await import("@libsql/client");
    const restaurado = createClient({ url: `file:${restauradoEm.replace(/\\/g, "/")}` });
    const linhas = await restaurado.execute("select handle from leads order by handle");
    const tabelas = await restaurado.execute(
      "select count(*) as n from sqlite_master where type='table'",
    );
    restaurado.close();

    const handles = linhas.rows.map((r) => String(r.handle));
    expect(handles).toContain("agencia.antes.do.backup");
    // O backup e um retrato do instante: o que entrou depois nao esta la.
    expect(handles).not.toContain("agencia.depois.do.backup");
    // E o banco inteiro, nao so a tabela que o teste olhou.
    expect(Number(tabelas.rows[0]?.n)).toBeGreaterThan(8);
  });

  it("guarda os N mais recentes e apaga o resto", () => {
    const pasta = join(dir, "rotacao");
    mkdirSync(pasta, { recursive: true });
    for (let i = 1; i <= 6; i += 1) {
      writeFileSync(join(pasta, `prospector-2026-09-0${i}T00-00-00.db`), "x");
    }
    // Arquivo que nao e nosso nao entra na conta nem e apagado.
    writeFileSync(join(pasta, "anotacao.txt"), "x");

    const apagados = backup.limparAntigos(pasta, 2);

    expect(apagados).toHaveLength(4);
    expect(readdirSync(pasta).sort()).toEqual([
      "anotacao.txt",
      "prospector-2026-09-05T00-00-00.db",
      "prospector-2026-09-06T00-00-00.db",
    ]);
  });

  it("pasta que nao existe nao vira erro", () => {
    expect(backup.limparAntigos(join(dir, "nao-existe"))).toEqual([]);
  });

  it("o nome carrega a data, entao ordem alfabetica e cronologica", () => {
    const cedo = backup.caminhoDoBackup("b", new Date("2026-09-01T03:00:00Z"));
    const tarde = backup.caminhoDoBackup("b", new Date("2026-09-10T22:30:00Z"));
    expect(cedo < tarde).toBe(true);
    expect(tarde).toMatch(/prospector-2026-09-10T22-30-00\.db$/);
  });

  it("caminho com aspas simples e recusado, nao interpolado no SQL", async () => {
    await expect(backup.fazerBackup(join(dir, "pasta'estranha"))).rejects.toThrow(/aspas/);
  });
});
