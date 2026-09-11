import { closeDb } from "../db/client.ts";
import { loadBusiness, oQueFalta } from "../lib/business.ts";
import { diasAteOTokenVencer, env, integrationStatus } from "../lib/env.ts";
import { remetenteDoAmbiente } from "../integrations/instagram/envio.ts";
import { rodarLaco, type Rodada } from "./laco.ts";

/**
 * Processo do worker.
 *
 * O boot e barulhento de proposito: e a unica hora em que da para descobrir
 * que falta token ou que a configuracao esta incoerente sem que uma pessoa de
 * verdade pague por isso. `loadBusiness()` derruba o processo se a
 * configuracao nao fechar.
 */

const negocio = loadBusiness();
const integracoes = integrationStatus();

console.log("[worker] PubliProva — prospector");
console.log(`[worker] modo: ${env.DRY_RUN ? "SIMULACAO (nada sai)" : "ENVIO REAL"}`);
console.log(`[worker] janela: ${env.OPERATING_HOURS} (${env.OPERATING_TIMEZONE})`);
console.log(`[worker] teto diario: ${env.MAX_DMS_PER_DAY}`);
console.log(`[worker] funis ligados: ${negocio.funisAtivos.join(", ")}`);
console.log(
  `[worker] palavras: ${negocio.palavrasChave
    .map((p) => `${p.palavra}→${p.destino.tipo}`)
    .join(", ")}`,
);
console.log(
  `[worker] integracoes: openai=${integracoes.openai} api=${integracoes.instagramApi} webhook=${integracoes.instagramWebhook}`,
);
for (const falta of oQueFalta(negocio)) {
  console.log(`[worker] desligado por falta de: ${falta}`);
}

// Token vencido nao da erro claro: todo envio volta 400 e parece bug nosso.
const diasDoToken = diasAteOTokenVencer();
if (diasDoToken !== null) {
  if (diasDoToken <= 0) {
    console.log(`[worker] ATENCAO: o token da Meta venceu. Rode: pnpm doutor`);
  } else if (diasDoToken <= 10) {
    console.log(`[worker] ATENCAO: o token da Meta vence em ${diasDoToken} dia(s). Rode: pnpm doutor`);
  } else {
    console.log(`[worker] token da Meta vence em ${diasDoToken} dias`);
  }
}

const remetente = remetenteDoAmbiente();

let desligando = false;
for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinal, () => {
    if (desligando) process.exit(1);
    desligando = true;
    console.log(`[worker] ${sinal} recebido — terminando a job atual e saindo`);
  });
}

function registrar(r: Rodada): void {
  switch (r.tipo) {
    case "vazio":
      return;
    case "pausado":
      console.log(`[worker] pausado — ${r.motivo}`);
      return;
    case "falhou":
      console.error(`[worker] job ${r.jobId} falhou (${r.destino}): ${r.erro}`);
      return;
    case "feita": {
      const res = r.resultado;
      if (res.tipo === "enviado") {
        console.log(
          `[worker] job ${r.jobId}: ${res.simulado ? "SIMULADO" : "enviado"} para lead ${res.leadId} (${res.externalId})`,
        );
      } else if (res.tipo === "adiado") {
        console.log(`[worker] job ${r.jobId}: adiada para ${res.ate.toISOString()} — ${res.motivo}`);
      } else if (res.tipo === "escalado") {
        console.log(`[worker] job ${r.jobId}: para humano — ${res.motivo}`);
      } else {
        console.log(`[worker] job ${r.jobId}: ignorada — ${res.motivo}`);
      }
    }
  }
}

await rodarLaco({ remetente }, { parar: () => desligando, aoRodar: registrar });

console.log("[worker] encerrado");
closeDb();
