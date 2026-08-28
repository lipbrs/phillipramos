import type {
  Agency, Campaign, Creator, CreatorWithState, Metrics, NudgeLog, PlanId, Submission,
} from './types';
import { slugify, token } from './parse';

/* ------------------------------------------------------------------ *
 * Dois drivers, uma interface.
 *  - Sem variáveis do Supabase  -> memória (roda `npm run dev` na hora)
 *  - Com variáveis do Supabase  -> Postgres de verdade (produção)
 * ------------------------------------------------------------------ */

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

export type NewCampaign = Omit<Campaign, 'id' | 'slug' | 'createdAt'>;
export type NewCreator = Omit<Creator, 'id' | 'campaignId' | 'token' | 'createdAt'>;

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso + 'T00:00:00Z');
  const b = Date.parse(toIso + 'T00:00:00Z');
  return Math.round((b - a) / 86_400_000);
}

export function stateOf(
  creator: Creator,
  submission: Submission | null,
  proofDeadline: string,
): { status: CreatorWithState['status']; daysLate: number } {
  if (submission) return { status: 'comprovado', daysLate: 0 };
  const late = daysBetween(proofDeadline, today());
  return late > 0 ? { status: 'atrasado', daysLate: late } : { status: 'pendente', daysLate: 0 };
}

/* ----------------------------- memória ---------------------------- */

type Mem = {
  agencies: Agency[];
  campaigns: Campaign[];
  creators: Creator[];
  submissions: Submission[];
  nudges: NudgeLog[];
  sessions: { token: string; agencyId: string; expiresAt: number }[];
  loginTokens: { token: string; email: string; expiresAt: number; usedAt: number | null }[];
  prints: Map<string, { data: Buffer; type: string }>;
};

const g = globalThis as unknown as { __publiprova?: Mem };

function mem(): Mem {
  if (!g.__publiprova) {
    g.__publiprova = {
      agencies: [], campaigns: [], creators: [], submissions: [], nudges: [],
      sessions: [], loginTokens: [], prints: new Map(),
    };
    seed(g.__publiprova);
  }
  return g.__publiprova;
}

export const DEMO_AGENCY_ID = 'ag-demo';

function seed(db: Mem) {
  const id = 'demo';
  db.agencies.push({
    id: DEMO_AGENCY_ID,
    email: 'demo@publiprova.local',
    name: 'Agência Exemplo',
    color: '#4f46e5',
    plan: 'agencia',
    createdAt: new Date().toISOString(),
  });
  const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
  db.campaigns.push({
    id,
    agencyId: DEMO_AGENCY_ID,
    slug: 'verao-hidrata-demo',
    agencyName: 'Agência Exemplo',
    agencyColor: '#4f46e5',
    client: 'Cliente Exemplo',
    brand: 'Verão Hidrata',
    briefing: '1 Reel de 30s mostrando a rotina + 2 Stories com link na bio. Marcar @verãohidrata.',
    postDeadline: day(-2),
    proofDeadline: day(0),
    createdAt: new Date().toISOString(),
  });

  const people: [string, string, string, number, Metrics | null][] = [
    ['Ana Ribeiro', 'anaribeiro', 'ana@exemplo.com', 800,
      { reach: 41200, impressions: 52800, likes: 2140, comments: 186, saves: 410, shares: 233, linkClicks: 512 }],
    ['Bruno Tavares', 'brunotv', 'bruno@exemplo.com', 1200,
      { reach: 88400, impressions: 121000, views: 96500, likes: 5310, comments: 402, saves: 890, shares: 611, linkClicks: 1204 }],
    ['Carla Nunes', 'carlanunes', 'carla@exemplo.com', 650, null],
    ['Diego Alves', 'diegoalves', 'diego@exemplo.com', 500, null],
  ];

  people.forEach(([name, handle, email, fee, metrics], i) => {
    const c: Creator = {
      id: `c${i + 1}`,
      campaignId: id,
      name,
      handle,
      email,
      whatsapp: '5511900000000',
      deliverables: '1 Reel + 2 Stories',
      fee,
      token: `demo${i + 1}${token(14)}`,
      createdAt: new Date().toISOString(),
    };
    db.creators.push(c);
    if (metrics) {
      db.submissions.push({
        id: `s${i + 1}`,
        creatorId: c.id,
        postUrl: `https://www.instagram.com/p/exemplo${i + 1}/`,
        screenshotUrl: null,
        metrics,
        submittedAt: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
        extractedByAi: true,
      });
    }
  });
}

/* ---------------------------- supabase ---------------------------- */

async function sb() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const fromRowCampaign = (r: any): Campaign => ({
  id: r.id, agencyId: r.agency_id, slug: r.slug, agencyName: r.agency_name, agencyColor: r.agency_color,
  client: r.client, brand: r.brand, briefing: r.briefing ?? '',
  postDeadline: r.post_deadline, proofDeadline: r.proof_deadline, createdAt: r.created_at,
});
const fromRowCreator = (r: any): Creator => ({
  id: r.id, campaignId: r.campaign_id, name: r.name, handle: r.handle ?? '',
  email: r.email ?? '', whatsapp: r.whatsapp ?? '', deliverables: r.deliverables ?? '',
  fee: Number(r.fee ?? 0), token: r.token, createdAt: r.created_at,
});
const fromRowAgency = (r: any): Agency => ({
  id: r.id, email: r.email, name: r.name, color: r.color ?? '#4f46e5',
  plan: (r.plan ?? 'free') as PlanId, createdAt: r.created_at,
});
const fromRowSubmission = (r: any): Submission => ({
  id: r.id, creatorId: r.creator_id, postUrl: r.post_url, screenshotUrl: r.screenshot_url,
  metrics: r.metrics ?? {}, submittedAt: r.submitted_at, extractedByAi: !!r.extracted_by_ai,
});

/* ------------------------------ API ------------------------------- */

export async function listCampaigns(): Promise<Campaign[]> {
  if (!usingSupabase) {
    return [...mem().campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const c = await sb();
  const { data, error } = await c.from('campaigns').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRowCampaign);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (!usingSupabase) return mem().campaigns.find((c) => c.id === id) ?? null;
  const c = await sb();
  const { data } = await c.from('campaigns').select('*').eq('id', id).maybeSingle();
  return data ? fromRowCampaign(data) : null;
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  if (!usingSupabase) return mem().campaigns.find((c) => c.slug === slug) ?? null;
  const c = await sb();
  const { data } = await c.from('campaigns').select('*').eq('slug', slug).maybeSingle();
  return data ? fromRowCampaign(data) : null;
}

export async function createCampaign(input: NewCampaign, creators: NewCreator[]): Promise<Campaign> {
  const slug = `${slugify(input.brand || input.client || 'campanha')}-${token(6)}`;
  if (!usingSupabase) {
    const db = mem();
    const campaign: Campaign = {
      ...input, id: token(10), slug, createdAt: new Date().toISOString(),
    };
    db.campaigns.push(campaign);
    creators.forEach((c) =>
      db.creators.push({
        ...c, id: token(10), campaignId: campaign.id, token: token(22), createdAt: new Date().toISOString(),
      }),
    );
    return campaign;
  }
  const c = await sb();
  const { data, error } = await c.from('campaigns').insert({
    slug, agency_id: input.agencyId, agency_name: input.agencyName, agency_color: input.agencyColor,
    client: input.client, brand: input.brand, briefing: input.briefing,
    post_deadline: input.postDeadline, proof_deadline: input.proofDeadline,
  }).select('*').single();
  if (error) throw new Error(error.message);
  const campaign = fromRowCampaign(data);
  if (creators.length) {
    const { error: e2 } = await c.from('creators').insert(
      creators.map((cr) => ({
        campaign_id: campaign.id, name: cr.name, handle: cr.handle, email: cr.email,
        whatsapp: cr.whatsapp, deliverables: cr.deliverables, fee: cr.fee, token: token(22),
      })),
    );
    if (e2) throw new Error(e2.message);
  }
  return campaign;
}

export async function listCreators(campaignId: string): Promise<Creator[]> {
  if (!usingSupabase) return mem().creators.filter((c) => c.campaignId === campaignId);
  const c = await sb();
  const { data, error } = await c.from('creators').select('*').eq('campaign_id', campaignId).order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRowCreator);
}

export async function listSubmissions(campaignId: string): Promise<Submission[]> {
  if (!usingSupabase) {
    const ids = new Set(mem().creators.filter((c) => c.campaignId === campaignId).map((c) => c.id));
    return mem().submissions.filter((s) => ids.has(s.creatorId));
  }
  const c = await sb();
  const { data, error } = await c.from('submissions').select('*, creators!inner(campaign_id)')
    .eq('creators.campaign_id', campaignId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRowSubmission);
}

export async function creatorsWithState(campaignId: string): Promise<CreatorWithState[]> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return [];
  const [creators, submissions] = await Promise.all([listCreators(campaignId), listSubmissions(campaignId)]);
  const byCreator = new Map(submissions.map((s) => [s.creatorId, s]));
  return creators.map((cr) => {
    const submission = byCreator.get(cr.id) ?? null;
    return { ...cr, submission, ...stateOf(cr, submission, campaign.proofDeadline) };
  });
}

export async function getByToken(
  tk: string,
): Promise<{ creator: Creator; campaign: Campaign; submission: Submission | null } | null> {
  if (!usingSupabase) {
    const creator = mem().creators.find((c) => c.token === tk);
    if (!creator) return null;
    const campaign = mem().campaigns.find((c) => c.id === creator.campaignId)!;
    const submission = mem().submissions.find((s) => s.creatorId === creator.id) ?? null;
    return { creator, campaign, submission };
  }
  const c = await sb();
  const { data } = await c.from('creators').select('*').eq('token', tk).maybeSingle();
  if (!data) return null;
  const creator = fromRowCreator(data);
  const campaign = await getCampaign(creator.campaignId);
  if (!campaign) return null;
  const { data: sub } = await c.from('submissions').select('*').eq('creator_id', creator.id).maybeSingle();
  return { creator, campaign, submission: sub ? fromRowSubmission(sub) : null };
}

export async function saveSubmission(input: {
  creatorId: string; postUrl: string; screenshotUrl: string | null;
  metrics: Metrics; extractedByAi: boolean;
}): Promise<Submission> {
  const submission: Submission = {
    id: token(10), creatorId: input.creatorId, postUrl: input.postUrl,
    screenshotUrl: input.screenshotUrl, metrics: input.metrics,
    submittedAt: new Date().toISOString(), extractedByAi: input.extractedByAi,
  };
  if (!usingSupabase) {
    const db = mem();
    const i = db.submissions.findIndex((s) => s.creatorId === input.creatorId);
    if (i >= 0) db.submissions[i] = { ...submission, id: db.submissions[i].id };
    else db.submissions.push(submission);
    return submission;
  }
  const c = await sb();
  const { data, error } = await c.from('submissions').upsert({
    creator_id: input.creatorId, post_url: input.postUrl, screenshot_url: input.screenshotUrl,
    metrics: input.metrics, extracted_by_ai: input.extractedByAi, submitted_at: submission.submittedAt,
  }, { onConflict: 'creator_id' }).select('*').single();
  if (error) throw new Error(error.message);
  return fromRowSubmission(data);
}

export async function alreadyNudged(creatorId: string, kind: string): Promise<boolean> {
  if (!usingSupabase) return mem().nudges.some((n) => n.creatorId === creatorId && n.kind === kind);
  const c = await sb();
  const { data } = await c.from('nudges').select('id').eq('creator_id', creatorId).eq('kind', kind).maybeSingle();
  return Boolean(data);
}

export async function logNudge(creatorId: string, kind: string): Promise<void> {
  if (!usingSupabase) {
    mem().nudges.push({ id: token(8), creatorId, kind, sentAt: new Date().toISOString() });
    return;
  }
  const c = await sb();
  await c.from('nudges').insert({ creator_id: creatorId, kind });
}

/* ---------------------- agências e sessões ------------------------ */

const SESSION_TTL = 30 * 86_400_000;     // 30 dias
const LOGIN_TOKEN_TTL = 15 * 60_000;     // 15 minutos

export async function getAgency(id: string): Promise<Agency | null> {
  if (!usingSupabase) return mem().agencies.find((a) => a.id === id) ?? null;
  const c = await sb();
  const { data } = await c.from('agencies').select('*').eq('id', id).maybeSingle();
  return data ? fromRowAgency(data) : null;
}

export async function getOrCreateAgencyByEmail(email: string): Promise<Agency> {
  const normalized = email.trim().toLowerCase();
  if (!usingSupabase) {
    const db = mem();
    const found = db.agencies.find((a) => a.email === normalized);
    if (found) return found;
    const agency: Agency = {
      id: token(10), email: normalized, name: 'Minha agência', color: '#4f46e5',
      plan: 'free', createdAt: new Date().toISOString(),
    };
    db.agencies.push(agency);
    return agency;
  }
  const c = await sb();
  const { data } = await c.from('agencies').select('*').eq('email', normalized).maybeSingle();
  if (data) return fromRowAgency(data);
  const { data: created, error } = await c.from('agencies')
    .insert({ email: normalized, name: 'Minha agência' }).select('*').single();
  if (error) throw new Error(error.message);
  return fromRowAgency(created);
}

export async function createLoginToken(email: string): Promise<string> {
  const tk = token(28);
  const expiresAt = Date.now() + LOGIN_TOKEN_TTL;
  if (!usingSupabase) {
    mem().loginTokens.push({ token: tk, email: email.trim().toLowerCase(), expiresAt, usedAt: null });
    return tk;
  }
  const c = await sb();
  const { error } = await c.from('login_tokens').insert({
    email: email.trim().toLowerCase(), token: tk, expires_at: new Date(expiresAt).toISOString(),
  });
  if (error) throw new Error(error.message);
  return tk;
}

/** Valida, marca como usado e devolve o e-mail — ou null se inválido/expirado. */
export async function consumeLoginToken(tk: string): Promise<string | null> {
  if (!usingSupabase) {
    const row = mem().loginTokens.find((t) => t.token === tk);
    if (!row || row.usedAt || row.expiresAt < Date.now()) return null;
    row.usedAt = Date.now();
    return row.email;
  }
  const c = await sb();
  const { data } = await c.from('login_tokens').select('*').eq('token', tk).is('used_at', null).maybeSingle();
  if (!data || Date.parse(data.expires_at) < Date.now()) return null;
  const { error } = await c.from('login_tokens').update({ used_at: new Date().toISOString() }).eq('id', data.id);
  if (error) throw new Error(error.message);
  return data.email;
}

export async function createSession(agencyId: string): Promise<string> {
  const tk = token(32);
  const expiresAt = Date.now() + SESSION_TTL;
  if (!usingSupabase) {
    mem().sessions.push({ token: tk, agencyId, expiresAt });
    return tk;
  }
  const c = await sb();
  const { error } = await c.from('sessions').insert({
    token: tk, agency_id: agencyId, expires_at: new Date(expiresAt).toISOString(),
  });
  if (error) throw new Error(error.message);
  return tk;
}

export async function getSessionAgency(tk: string): Promise<Agency | null> {
  if (!tk) return null;
  if (!usingSupabase) {
    const row = mem().sessions.find((s) => s.token === tk && s.expiresAt > Date.now());
    return row ? getAgency(row.agencyId) : null;
  }
  const c = await sb();
  const { data } = await c.from('sessions').select('agency_id, expires_at').eq('token', tk).maybeSingle();
  if (!data || Date.parse(data.expires_at) < Date.now()) return null;
  return getAgency(data.agency_id);
}

export async function deleteSession(tk: string): Promise<void> {
  if (!usingSupabase) {
    const db = mem();
    db.sessions = db.sessions.filter((s) => s.token !== tk);
    return;
  }
  const c = await sb();
  await c.from('sessions').delete().eq('token', tk);
}

export async function listCampaignsByAgency(agencyId: string): Promise<Campaign[]> {
  return (await listCampaigns()).filter((c) => c.agencyId === agencyId);
}

/* ----------------------- uso e limites de plano ------------------- */

export async function countActiveCampaigns(agencyId: string): Promise<number> {
  const now = today();
  return (await listCampaignsByAgency(agencyId)).filter((c) => c.proofDeadline >= now).length;
}

/** Creators criados no mês corrente — a métrica cobrada dos planos. */
export async function countCreatorsThisMonth(agencyId: string): Promise<number> {
  const monthStart = today().slice(0, 7) + '-01';
  if (!usingSupabase) {
    const ids = new Set(mem().campaigns.filter((c) => c.agencyId === agencyId).map((c) => c.id));
    return mem().creators.filter((cr) => ids.has(cr.campaignId) && cr.createdAt.slice(0, 10) >= monthStart).length;
  }
  const c = await sb();
  const { count, error } = await c.from('creators')
    .select('id, campaigns!inner(agency_id)', { count: 'exact', head: true })
    .eq('campaigns.agency_id', agencyId)
    .gte('created_at', monthStart);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/* --------------------------- prints ------------------------------- */

export type StoredPrint =
  | { kind: 'data'; data: Buffer; type: string }
  | { kind: 'url'; url: string };

export async function savePrint(id: string, data: Buffer, type: string): Promise<void> {
  if (!usingSupabase) {
    mem().prints.set(id, { data, type });
    return;
  }
  const c = await sb();
  const { error } = await c.storage.from('prints').upload(id, data, { contentType: type, upsert: true });
  if (error) throw new Error(error.message);
}

export async function getPrint(id: string): Promise<StoredPrint | null> {
  if (!usingSupabase) {
    const row = mem().prints.get(id);
    return row ? { kind: 'data', data: row.data, type: row.type } : null;
  }
  const c = await sb();
  const { data, error } = await c.storage.from('prints').createSignedUrl(id, 300);
  if (error || !data?.signedUrl) return null;
  return { kind: 'url', url: data.signedUrl };
}
