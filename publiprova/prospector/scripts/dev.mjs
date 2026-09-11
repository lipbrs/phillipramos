import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Sobe painel e worker juntos, com um comando so.
 *
 * Os dois compartilham o mesmo arquivo SQLite. O WAL esta ligado em
 * `applyPragmas()`, entao leitura do painel e escrita do worker convivem sem
 * travar uma a outra.
 */

if (!existsSync(".env")) {
  console.error("Falta o .env. Copie de .env.example e preencha — ver SETUP.md, secao 4.");
  process.exit(1);
}
if (!existsSync("config/business.json")) {
  console.error("Falta config/business.json. Copie de config/business.example.json.");
  process.exit(1);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const processos = [
  { nome: "painel", cmd: npx, args: ["next", "dev", "-p", "3100"] },
  {
    nome: "worker",
    cmd: process.execPath,
    args: ["--env-file=.env", "--experimental-strip-types", "src/worker/main.ts"],
  },
].map(({ nome, cmd, args }) => {
  const filho = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
  for (const fluxo of [filho.stdout, filho.stderr]) {
    fluxo.setEncoding("utf8");
    let resto = "";
    fluxo.on("data", (pedaco) => {
      const linhas = (resto + pedaco).split("\n");
      resto = linhas.pop() ?? "";
      for (const linha of linhas) if (linha.trim()) console.log(`[${nome}] ${linha}`);
    });
  }
  filho.on("exit", (codigo) => {
    console.log(`[${nome}] saiu com ${codigo}`);
    // Um sem o outro nao serve: melhor cair inteiro do que rodar pela metade.
    encerrar(codigo ?? 1);
  });
  return filho;
});

let encerrando = false;
function encerrar(codigo) {
  if (encerrando) return;
  encerrando = true;
  for (const p of processos) p.kill("SIGTERM");
  setTimeout(() => process.exit(codigo), 500);
}

for (const sinal of ["SIGINT", "SIGTERM"]) process.on(sinal, () => encerrar(0));

console.log("Painel em http://localhost:3100 — Ctrl+C derruba os dois.");
