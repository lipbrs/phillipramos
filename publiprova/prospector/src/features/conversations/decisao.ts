import type { Destino } from "../../lib/business.ts";
import { checkClaims, describeViolations } from "../../lib/claims.ts";

/**
 * Intencoes que o classificador pode devolver. Sao fechadas de proposito: se o
 * modelo inventar outra, cai em `ambiguous` e vai para revisao humana.
 */
export const INTENCOES = [
  "interested",
  "asked_info",
  "asked_pricing",
  "wants_whatsapp",
  "not_the_owner",
  "will_forward",
  "objection",
  "not_interested",
  "opt_out",
  "ambiguous",
  "needs_human",
] as const;

export type Intencao = (typeof INTENCOES)[number];

export const ACOES = [
  "responder",
  "perguntar",
  "apresentar",
  "tratar_objecao",
  /** Entrega o que o post prometeu: demo, conteudo na DM ou convite da pesquisa. */
  "entregar_promessa",
  "encaminhar_whatsapp",
  "aguardar",
  "agendar_follow_up",
  "encerrar",
  "escalar_humano",
] as const;

export type Acao = (typeof ACOES)[number];

export function ehIntencao(valor: string): valor is Intencao {
  return (INTENCOES as readonly string[]).includes(valor);
}

/**
 * De intencao para acao. E tabela e nao prompt porque o que fazer com cada
 * intencao e regra de negocio: preco esta bloqueado, entao quem responde e o
 * Phillip, nao o modelo.
 */
const POR_INTENCAO: Record<Intencao, Acao> = {
  interested: "entregar_promessa",
  asked_info: "responder",
  asked_pricing: "escalar_humano",
  // Resolvida caso a caso em `decidir`, porque depende do destino configurado.
  wants_whatsapp: "escalar_humano",
  not_the_owner: "perguntar",
  will_forward: "agendar_follow_up",
  objection: "tratar_objecao",
  not_interested: "encerrar",
  opt_out: "encerrar",
  ambiguous: "escalar_humano",
  needs_human: "escalar_humano",
};

export type Contexto = {
  intencao: Intencao;
  /** Confianca do classificador, 0..1. */
  confianca: number;
  /** O que o post prometeu a quem comentou aquela palavra. */
  destino: Destino["tipo"];
  /** Ja entregamos a promessa nessa conversa? */
  jaEntregou: boolean;
  /** Quantas mensagens nossas ja foram nessa conversa. */
  mensagensEnviadas: number;
  /** So true quando `links.whatsapp` esta preenchido. */
  whatsappConfigurado: boolean;
};

export type Decisao = { acao: Acao; motivo: string };

/** Abaixo disso, nao confiamos na classificacao e mandamos para humano. */
const CONFIANCA_MINIMA = 0.6;
/** Teto de mensagens nossas antes de parar de insistir. */
const MAXIMO_DE_MENSAGENS = 5;

export function decidir(ctx: Contexto): Decisao {
  if (ctx.intencao === "opt_out") {
    return { acao: "encerrar", motivo: "pedido de parar" };
  }
  if (ctx.confianca < CONFIANCA_MINIMA) {
    return {
      acao: "escalar_humano",
      motivo: `confianca ${ctx.confianca.toFixed(2)} abaixo de ${CONFIANCA_MINIMA}`,
    };
  }
  if (ctx.mensagensEnviadas >= MAXIMO_DE_MENSAGENS) {
    return { acao: "encerrar", motivo: "limite de mensagens da conversa atingido" };
  }

  // Pediu para falar noutro canal: so encaminha se esse canal existir.
  if (ctx.intencao === "wants_whatsapp") {
    if (ctx.destino === "whatsapp" && ctx.whatsappConfigurado) {
      return { acao: "encaminhar_whatsapp", motivo: "destino configurado" };
    }
    return {
      acao: "escalar_humano",
      motivo: "lead quer outro canal e nao temos WhatsApp configurado",
    };
  }

  const acao = POR_INTENCAO[ctx.intencao];

  if (acao === "entregar_promessa") {
    if (ctx.jaEntregou) {
      return { acao: "responder", motivo: "promessa ja entregue nessa conversa" };
    }
    if (ctx.destino === "whatsapp" && !ctx.whatsappConfigurado) {
      return { acao: "escalar_humano", motivo: "destino e WhatsApp, mas o link nao existe" };
    }
  }

  return { acao, motivo: `intencao ${ctx.intencao}` };
}

export type Revisao = { liberado: true; texto: string } | { liberado: false; motivo: string };

/**
 * Ultimo portao antes de qualquer envio. Nada sai daqui sem passar pelo filtro
 * de afirmacoes, nem mesmo texto escrito a mao — porque o caminho de envio e o
 * mesmo e o erro custa a mesma coisa.
 */
export function revisarSaida(texto: string): Revisao {
  const limpo = texto.trim();
  if (!limpo) return { liberado: false, motivo: "texto vazio" };
  if (limpo.length > 900) {
    return { liberado: false, motivo: `texto com ${limpo.length} caracteres; o teto e 900` };
  }
  if (limpo.includes("{{")) {
    return { liberado: false, motivo: "texto contem placeholder nao preenchido" };
  }

  const checagem = checkClaims(limpo);
  if (!checagem.ok) {
    return { liberado: false, motivo: describeViolations(checagem.violations) };
  }
  return { liberado: true, texto: limpo };
}
