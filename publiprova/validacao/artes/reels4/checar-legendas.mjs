// Passa as legendas e os textos de tela do lote 04 pelo mesmo filtro de afirmações
// que o prospector usa antes de mandar qualquer DM. Número inventado, garantia e
// superlativo não entram no Instagram também.
// Uso: node --experimental-strip-types checar-legendas.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { checkClaims, describeViolations } from "../../../prospector/src/lib/claims.ts";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const legendas = JSON.parse(readFileSync(path.join(aqui, "legendas.json"), "utf8"));

// Texto que aparece na tela: tira as tags e junta tudo por Reel.
const textoDeTela = (id) => readFileSync(path.join(aqui, `${id}.html`), "utf8")
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");

let falhas = 0;
for (const [id, legenda] of Object.entries(legendas)) {
  for (const [onde, texto] of [["legenda", legenda], ["tela", textoDeTela(id)]]) {
    const r = checkClaims(texto);
    if (r.ok) {
      console.log(`  ok    ${id} ${onde}`);
    } else {
      falhas++;
      console.log(`  BARRA ${id} ${onde}: ${describeViolations(r.violations)}`);
    }
  }
}
console.log(falhas ? `\n${falhas} bloqueio(s). Reescrever o texto, não a regra.` : "\nNada barrado.");
process.exitCode = falhas ? 1 : 0;
