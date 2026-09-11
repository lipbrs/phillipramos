import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Os valores internos ficam em ingles e a interface traduz (src/lib/labels.ts).
 * Pipeline e canal sao colunas separadas de proposito: um lead pode estar em
 * `interested` no funil e com o canal em `api_window_closed` ao mesmo tempo.
 */
export const CUSTOMER_STAGES = [
  "discovered",
  "qualified",
  "contacted",
  "replied",
  "interested",
  "whatsapp_handoff",
  "registered",
  "active_customer",
  "closed",
] as const;

export const AFFILIATE_STAGES = [
  "discovered",
  "qualified",
  "contacted",
  "replied",
  "interested",
  "joined_affiliate_group",
  "active_affiliate",
  "generated_customer",
  "closed",
] as const;

/**
 * O primeiro contato e resposta privada a comentario (API oficial, janela de 7
 * dias), nunca DM nao solicitada — por isso a maquina comeca em `inbound_pending`.
 */
export const CHANNEL_STATES = [
  "inbound_pending",
  "private_reply_sent",
  "waiting_inbound_reply",
  "api_eligible",
  "api_active",
  "api_window_closed",
  "human_review_required",
  "do_not_contact",
  "blocked",
  "completed",
] as const;

export const FUNNELS = ["customer", "affiliate"] as const;

export type CustomerStage = (typeof CUSTOMER_STAGES)[number];
export type AffiliateStage = (typeof AFFILIATE_STAGES)[number];
export type ChannelState = (typeof CHANNEL_STATES)[number];
export type Funnel = (typeof FUNNELS)[number];

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Id numerico do Instagram; so existe depois que a Meta manda. */
    igUserId: text("ig_user_id"),
    /** Handle sem @ e em minusculas. E a chave de deduplicacao. */
    handle: text("handle").notNull(),
    displayName: text("display_name"),
    bio: text("bio"),
    category: text("category"),
    followerCount: integer("follower_count"),
    funnel: text("funnel").$type<Funnel>().notNull(),
    stage: text("stage").notNull(),
    channelState: text("channel_state").$type<ChannelState>().notNull(),
    /** Aderencia ao ICP, de 0 a 100. */
    score: integer("score").notNull().default(0),
    scoreReason: text("score_reason"),
    /** "comment_keyword" | "vidiq_search" | "manual" | "referral" */
    source: text("source").notNull(),
    sourceDetail: text("source_detail"),
    /** Qual post e qual palavra-chave trouxeram o lead. */
    originPostId: text("origin_post_id"),
    originKeyword: text("origin_keyword"),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    /** Quando a janela de mensagem da Meta expira, em ISO-8601 UTC. */
    messagingWindowExpiresAt: text("messaging_window_expires_at"),
    nextActionAt: text("next_action_at"),
    nextActionKind: text("next_action_kind"),
    optOutAt: text("opt_out_at"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("leads_handle_funnel_uq").on(t.handle, t.funnel),
    uniqueIndex("leads_ig_user_funnel_uq").on(t.igUserId, t.funnel),
    index("leads_stage_idx").on(t.funnel, t.stage),
    index("leads_next_action_idx").on(t.nextActionAt),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    leadId: integer("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    direction: text("direction").$type<"outbound" | "inbound">().notNull(),
    /** "private_reply" | "api_dm" | "comment" */
    channel: text("channel").notNull(),
    body: text("body").notNull(),
    /** Id da mensagem na Meta — chave de idempotencia do webhook. */
    externalId: text("external_id"),
    variantId: integer("variant_id"),
    sentAt: text("sent_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("messages_external_uq").on(t.externalId),
    index("messages_lead_idx").on(t.leadId, t.sentAt),
  ],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payload: text("payload", { mode: "json" }),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    index("events_lead_idx").on(t.leadId, t.createdAt),
    index("events_kind_idx").on(t.kind),
  ],
);

export const jobs = sqliteTable(
  "jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind").notNull(),
    payload: text("payload", { mode: "json" }),
    /** Chave que impede a mesma job logica de entrar duas vezes na fila. */
    idempotencyKey: text("idempotency_key"),
    status: text("status")
      .$type<"pending" | "running" | "done" | "failed" | "dead">()
      .notNull()
      .default("pending"),
    runAt: text("run_at").notNull().default(now),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastError: text("last_error"),
    lockedAt: text("locked_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("jobs_idempotency_uq").on(t.idempotencyKey),
    index("jobs_claim_idx").on(t.status, t.runAt),
  ],
);

export const experiments = sqliteTable("experiments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  /** A unica variavel em teste, por exemplo "opening_line". */
  variable: text("variable").notNull(),
  funnel: text("funnel").$type<Funnel>().notNull(),
  status: text("status")
    .$type<"draft" | "running" | "stopped" | "decided">()
    .notNull()
    .default("draft"),
  /** Minimo de alocacoes por braco antes de poder declarar vencedor. */
  minSampleSize: integer("min_sample_size").notNull().default(50),
  primaryMetric: text("primary_metric").notNull(),
  decidedVariantId: integer("decided_variant_id"),
  createdAt: text("created_at").notNull().default(now),
});

export const variants = sqliteTable(
  "variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    experimentId: integer("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isControl: integer("is_control", { mode: "boolean" }).notNull().default(false),
    /** Peso relativo na alocacao; o braco de exploracao tem piso garantido. */
    weight: real("weight").notNull().default(1),
    content: text("content", { mode: "json" }).notNull(),
  },
  (t) => [uniqueIndex("variants_experiment_name_uq").on(t.experimentId, t.name)],
);

export const assignments = sqliteTable(
  "assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    experimentId: integer("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    leadId: integer("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    assignedAt: text("assigned_at").notNull().default(now),
  },
  (t) => [uniqueIndex("assignments_experiment_lead_uq").on(t.experimentId, t.leadId)],
);

export const aiCalls = sqliteTable(
  "ai_calls",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    purpose: text("purpose").notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    costUsd: real("cost_usd").notNull().default(0),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("ai_calls_created_idx").on(t.createdAt)],
);

/** Uma linha por chave: pausa geral, circuit breakers, contadores de aquecimento. */
export const systemState = sqliteTable("system_state", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: text("updated_at").notNull().default(now),
});

export const doNotContact = sqliteTable(
  "do_not_contact",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    handle: text("handle").notNull(),
    igUserId: text("ig_user_id"),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [uniqueIndex("dnc_handle_uq").on(t.handle)],
);

export const exceptions = sqliteTable("exceptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  detail: text("detail").notNull(),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull().default(now),
});
