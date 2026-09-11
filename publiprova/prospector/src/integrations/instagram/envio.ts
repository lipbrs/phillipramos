import { createHash } from "node:crypto";

import { env } from "../../lib/env.ts";

/**
 * A saida para o mundo.
 *
 * Sao dois envios possiveis, os dois pela API oficial:
 *
 * - `private_reply` — resposta privada a um comentario. E o primeiro contato, e
 *   a janela e de 7 dias a partir do comentario.
 * - `api_dm` — DM comum, so depois que a pessoa escreveu. Janela de 24 h.
 *
 * Nao existe terceiro caminho. O que a API recusa, o sistema nao faz por fora
 * (ver ADR-001).
 */

export type Envio =
  | { tipo: "private_reply"; comentarioId: string; texto: string }
  | { tipo: "api_dm"; igUserId: string; texto: string };

export type Enviado = {
  /** Id da mensagem na Meta. Vira `messages.external_id` e trava a duplicata. */
  externalId: string;
  simulado: boolean;
};

export interface Remetente {
  enviar(envio: Envio): Promise<Enviado>;
}

export class FalhaDeEnvio extends Error {
  readonly status: number;
  readonly corpo: string;
  /** true quando adianta tentar de novo (5xx, limite de taxa). */
  readonly retentavel: boolean;

  constructor(status: number, corpo: string, retentavel: boolean) {
    super(`Meta respondeu ${status}: ${corpo.slice(0, 300)}`);
    this.status = status;
    this.corpo = corpo;
    this.retentavel = retentavel;
    this.name = "FalhaDeEnvio";
  }
}

/**
 * Modo simulacao. Faz tudo menos sair da maquina, e devolve um id estavel: o
 * mesmo envio simulado duas vezes colide no unique de `external_id`, entao a
 * simulacao exercita a mesma protecao contra duplicata que a producao.
 */
export function remetenteSimulado(): Remetente {
  return {
    async enviar(envio: Envio): Promise<Enviado> {
      const alvo = envio.tipo === "private_reply" ? envio.comentarioId : envio.igUserId;
      const digest = createHash("sha256")
        .update(`${envio.tipo}:${alvo}:${envio.texto}`)
        .digest("hex")
        .slice(0, 24);
      return { externalId: `simulado:${digest}`, simulado: true };
    },
  };
}

export type DepsMeta = {
  token: string;
  contaId: string;
  /** Injetavel para teste; em producao e o `fetch` global. */
  fetch?: typeof globalThis.fetch;
  versao?: string;
};

/**
 * Cliente da API oficial. O formato do corpo e o mesmo nos dois casos; o que
 * muda e o `recipient`: `comment_id` para resposta privada, `id` para DM.
 *
 * Isto e testado contra um `fetch` de mentira — o formato da requisicao, a
 * leitura do id devolvido e a classificacao do erro estao cobertos. O que so a
 * conta real prova e se o token tem as permissoes certas; por isso a secao 7 do
 * SETUP manda passar pelo ensaio antes do piloto.
 */
export function remetenteMeta(deps: DepsMeta): Remetente {
  const buscar = deps.fetch ?? globalThis.fetch;
  const versao = deps.versao ?? "v23.0";
  const url = `https://graph.instagram.com/${versao}/${deps.contaId}/messages`;

  return {
    async enviar(envio: Envio): Promise<Enviado> {
      const recipient =
        envio.tipo === "private_reply"
          ? { comment_id: envio.comentarioId }
          : { id: envio.igUserId };

      const resposta = await buscar(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deps.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient, message: { text: envio.texto } }),
      });

      const corpo = await resposta.text();

      if (!resposta.ok) {
        // 4xx e erro nosso (token, janela fechada, permissao) e insistir so
        // gasta tentativa. 5xx e 429 sao do outro lado e passam.
        const retentavel = resposta.status >= 500 || resposta.status === 429;
        throw new FalhaDeEnvio(resposta.status, corpo, retentavel);
      }

      const dados = JSON.parse(corpo) as { message_id?: string };
      if (!dados.message_id) {
        throw new FalhaDeEnvio(resposta.status, `resposta sem message_id: ${corpo}`, false);
      }
      return { externalId: dados.message_id, simulado: false };
    },
  };
}

/**
 * Escolhe o remetente pelo ambiente. `DRY_RUN` ganha de tudo, e a falta de
 * token tambem cai em simulacao — nunca em envio parcial.
 */
export function remetenteDoAmbiente(): Remetente {
  if (env.DRY_RUN) return remetenteSimulado();
  const token = env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  const contaId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !contaId) {
    throw new Error(
      "DRY_RUN=false exige INSTAGRAM_PAGE_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID no .env",
    );
  }
  return remetenteMeta({ token, contaId });
}
