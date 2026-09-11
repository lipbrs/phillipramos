import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db/client.ts";
import {
  doNotContact,
  events,
  leads,
  type ChannelState,
  type Funnel,
} from "../../db/schema.ts";
import {
  assertChannelTransition,
  assertStageTransition,
  isTerminalChannel,
  type Stage,
} from "./transitions.ts";

export type Lead = typeof leads.$inferSelect;

const utcNow = () => new Date().toISOString();

/** Handles are compared lowercased and without the @ — that is the dedupe key. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export type DiscoverInput = {
  handle: string;
  funnel: Funnel;
  source: string;
  igUserId?: string | null;
  displayName?: string | null;
  bio?: string | null;
  followerCount?: number | null;
  sourceDetail?: string | null;
  originPostId?: string | null;
  originKeyword?: string | null;
};

export type DiscoverResult = { lead: Lead; created: boolean; suppressed: boolean };

/**
 * Idempotent discovery. Re-running the same search never creates a second row:
 * the unique index on (handle, funnel) is the guarantee, not an existence check
 * — two workers racing would both pass a check, but only one wins the insert.
 */
export async function discoverLead(input: DiscoverInput): Promise<DiscoverResult> {
  const handle = normalizeHandle(input.handle);

  const blocked = await db.select().from(doNotContact).where(eq(doNotContact.handle, handle)).limit(1);
  if (blocked.length > 0) {
    const existing = await findByHandle(handle, input.funnel);
    if (existing) return { lead: existing, created: false, suppressed: true };
  }

  const initialChannel: ChannelState = blocked.length > 0 ? "do_not_contact" : "inbound_pending";

  const inserted = await db
    .insert(leads)
    .values({
      handle,
      igUserId: input.igUserId ?? null,
      displayName: input.displayName ?? null,
      bio: input.bio ?? null,
      followerCount: input.followerCount ?? null,
      funnel: input.funnel,
      stage: "discovered",
      channelState: initialChannel,
      source: input.source,
      sourceDetail: input.sourceDetail ?? null,
      originPostId: input.originPostId ?? null,
      originKeyword: input.originKeyword ?? null,
    })
    .onConflictDoNothing({ target: [leads.handle, leads.funnel] })
    .returning();

  if (inserted.length > 0) {
    await recordEvent(inserted[0]!.id, "lead_discovered", {
      source: input.source,
      keyword: input.originKeyword ?? null,
    });
    return { lead: inserted[0]!, created: true, suppressed: initialChannel === "do_not_contact" };
  }

  const existing = await findByHandle(handle, input.funnel);
  if (!existing) throw new Error(`lead ${handle} nao encontrado apos conflito de insert`);
  return { lead: existing, created: false, suppressed: existing.channelState === "do_not_contact" };
}

export async function findByHandle(handle: string, funnel: Funnel): Promise<Lead | undefined> {
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.handle, normalizeHandle(handle)), eq(leads.funnel, funnel)))
    .limit(1);
  return rows[0];
}

export async function getLead(id: number): Promise<Lead> {
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const lead = rows[0];
  if (!lead) throw new Error(`lead ${id} nao existe`);
  return lead;
}

export async function recordEvent(
  leadId: number | null,
  kind: string,
  payload?: unknown,
): Promise<void> {
  await db.insert(events).values({ leadId, kind, payload: payload ?? null });
}

/**
 * Guarded stage change. The guard runs against the row we just read and the
 * UPDATE re-asserts that same stage in its WHERE, so a concurrent writer cannot
 * slip a different transition in between.
 */
export async function advanceStage(leadId: number, to: Stage, reason?: string): Promise<Lead> {
  const lead = await getLead(leadId);
  assertStageTransition(lead.funnel, lead.stage as Stage, to);
  if (lead.stage === to) return lead;

  const updated = await db
    .update(leads)
    .set({ stage: to, updatedAt: utcNow() })
    .where(and(eq(leads.id, leadId), eq(leads.stage, lead.stage)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`lead ${leadId} mudou de etapa durante a transicao — tente de novo`);
  }
  await recordEvent(leadId, "stage_changed", { from: lead.stage, to, reason: reason ?? null });
  return updated[0]!;
}

export async function setChannelState(
  leadId: number,
  to: ChannelState,
  reason?: string,
): Promise<Lead> {
  const lead = await getLead(leadId);
  assertChannelTransition(lead.channelState, to);
  if (lead.channelState === to) return lead;

  const updated = await db
    .update(leads)
    .set({ channelState: to, updatedAt: utcNow() })
    .where(and(eq(leads.id, leadId), eq(leads.channelState, lead.channelState)))
    .returning();

  if (updated.length === 0) {
    throw new Error(`lead ${leadId} mudou de canal durante a transicao — tente de novo`);
  }
  await recordEvent(leadId, "channel_changed", {
    from: lead.channelState,
    to,
    reason: reason ?? null,
  });
  return updated[0]!;
}

/**
 * Opt-out. Permanent and cross-campaign: the handle goes on the block list, so
 * even a future discovery from another source comes back suppressed.
 */
export async function markDoNotContact(leadId: number, reason: string): Promise<Lead> {
  const lead = await getLead(leadId);

  await db
    .insert(doNotContact)
    .values({ handle: lead.handle, igUserId: lead.igUserId, reason })
    .onConflictDoNothing({ target: doNotContact.handle });

  if (isTerminalChannel(lead.channelState)) {
    await recordEvent(leadId, "opt_out_noop", { alreadyTerminal: lead.channelState });
    return lead;
  }

  const updated = await db
    .update(leads)
    .set({
      channelState: "do_not_contact",
      optOutAt: utcNow(),
      nextActionAt: null,
      nextActionKind: null,
      updatedAt: utcNow(),
    })
    .where(eq(leads.id, leadId))
    .returning();

  await recordEvent(leadId, "opt_out", { reason });
  return updated[0]!;
}

export async function timeline(leadId: number) {
  return db
    .select()
    .from(events)
    .where(eq(events.leadId, leadId))
    .orderBy(sql`${events.createdAt} ASC, ${events.id} ASC`);
}
