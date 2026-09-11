import {
  AFFILIATE_STAGES,
  CHANNEL_STATES,
  CUSTOMER_STAGES,
  type AffiliateStage,
  type ChannelState,
  type CustomerStage,
  type Funnel,
} from "../../db/schema.ts";

export type Stage = CustomerStage | AffiliateStage;

/**
 * Arestas permitidas. O que nao esta listado e recusado - e isso que impede um
 * lead de pular direto para `active_customer` porque um modelo achou que sim.
 * Toda etapa pode ir para `closed`; nada sai de `closed`.
 */
const CUSTOMER_EDGES: Record<CustomerStage, readonly CustomerStage[]> = {
  discovered: ["qualified", "closed"],
  qualified: ["contacted", "closed"],
  contacted: ["replied", "closed"],
  replied: ["interested", "closed"],
  interested: ["whatsapp_handoff", "closed"],
  whatsapp_handoff: ["registered", "closed"],
  registered: ["active_customer", "closed"],
  active_customer: ["closed"],
  closed: [],
};

const AFFILIATE_EDGES: Record<AffiliateStage, readonly AffiliateStage[]> = {
  discovered: ["qualified", "closed"],
  qualified: ["contacted", "closed"],
  contacted: ["replied", "closed"],
  replied: ["interested", "closed"],
  interested: ["joined_affiliate_group", "closed"],
  joined_affiliate_group: ["active_affiliate", "closed"],
  active_affiliate: ["generated_customer", "closed"],
  generated_customer: ["closed"],
  closed: [],
};

/**
 * Maquina do canal. O primeiro contato e resposta privada a comentario pela API
 * oficial, entao o lead so vira contatavel depois de chegar por conta propria.
 * `do_not_contact` e `blocked` sao absorventes: nada sai deles, nunca.
 */
const CHANNEL_EDGES: Record<ChannelState, readonly ChannelState[]> = {
  // `api_eligible` esta aqui porque DM recebida tambem e contato iniciado pela
  // pessoa: abre a janela de 24 h igual o comentario abre a de 7 dias. Sem esta
  // aresta, quem escreve sem ter comentado fica sem resposta para sempre.
  inbound_pending: ["private_reply_sent", "api_eligible", "human_review_required", "do_not_contact", "blocked"],
  private_reply_sent: ["waiting_inbound_reply", "human_review_required", "do_not_contact", "blocked"],
  waiting_inbound_reply: ["api_eligible", "api_window_closed", "human_review_required", "do_not_contact", "blocked", "completed"],
  api_eligible: ["api_active", "api_window_closed", "human_review_required", "do_not_contact", "blocked"],
  api_active: ["api_window_closed", "human_review_required", "do_not_contact", "blocked", "completed"],
  api_window_closed: ["api_eligible", "human_review_required", "do_not_contact", "completed"],
  human_review_required: ["api_active", "api_eligible", "api_window_closed", "do_not_contact", "blocked", "completed"],
  do_not_contact: [],
  blocked: [],
  completed: [],
};

export class TransitionError extends Error {
  readonly from: string;
  readonly to: string;

  constructor(message: string, from: string, to: string) {
    super(message);
    this.from = from;
    this.to = to;
    this.name = "TransitionError";
  }
}

export function stagesFor(funnel: Funnel): readonly Stage[] {
  return funnel === "customer" ? CUSTOMER_STAGES : AFFILIATE_STAGES;
}

export function canAdvanceStage(funnel: Funnel, from: Stage, to: Stage): boolean {
  const edges = funnel === "customer" ? CUSTOMER_EDGES : AFFILIATE_EDGES;
  const allowed = (edges as Record<string, readonly string[]>)[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

export function assertStageTransition(funnel: Funnel, from: Stage, to: Stage): void {
  if (from === to) return;
  if (!canAdvanceStage(funnel, from, to)) {
    throw new TransitionError(
      `Transicao de pipeline invalida no funil ${funnel}: ${from} -> ${to}`,
      from,
      to,
    );
  }
}

export function canChangeChannel(from: ChannelState, to: ChannelState): boolean {
  return CHANNEL_EDGES[from]?.includes(to) ?? false;
}

export function assertChannelTransition(from: ChannelState, to: ChannelState): void {
  if (from === to) return;
  if (!canChangeChannel(from, to)) {
    throw new TransitionError(`Transicao de canal invalida: ${from} -> ${to}`, from, to);
  }
}

/** Estados absorventes: entrou, nao sai mais. */
export function isTerminalChannel(state: ChannelState): boolean {
  return CHANNEL_EDGES[state].length === 0;
}

/**
 * A trava de propriedade do canal. So estes estados podem gerar envio, e cada um
 * permite exatamente um tipo — e isto que torna impossivel o envio duplicado
 * entre o caminho da resposta privada e o da API.
 */
const SENDABLE: Partial<Record<ChannelState, "private_reply" | "api_dm">> = {
  inbound_pending: "private_reply",
  api_eligible: "api_dm",
  api_active: "api_dm",
};

export function assertCanSend(
  state: ChannelState,
  kind: "private_reply" | "api_dm",
): void {
  const allowed = SENDABLE[state];
  if (!allowed) {
    throw new TransitionError(`Canal ${state} nao permite envio`, state, kind);
  }
  if (allowed !== kind) {
    throw new TransitionError(
      `Canal ${state} so permite ${allowed}, nao ${kind}`,
      state,
      kind,
    );
  }
}

export { CHANNEL_STATES, CUSTOMER_STAGES, AFFILIATE_STAGES };
