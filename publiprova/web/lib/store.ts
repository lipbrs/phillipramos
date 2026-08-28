import type {
  Campaign, Creator, CreatorWithState, Metrics, NudgeLog, Submission,
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
  campaigns: Campaign[];
  creators: Creator[];
  submissions: Submission[];
  nudges: NudgeLog[];
};

const g = globalThis as unknown as { __publiprova?: Mem };

function mem(): Mem {
  if (!g.__publiprova) {
    g.__publiprova = { campaigns: [], creators: [], submissions: [], nudges: [] };
    seed(g.__publiprova);
  }
  return g.__publiprova;
}

function seed(db: Mem) {
  const id = 'demo';
  const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
  db.campaigns.push({
    id,
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
  id: r.id, slug: r.slug, agencyName: r.agency_name, agencyColor: r.agency_color,
  client: r.client, brand: r.brand, briefing: r.briefing ?? '',
  postDeadline: r.post_deadline, proofDeadline: r.proof_deadline, createdAt: r.created_at,
});
const fromRowCreator = (r: any): Creator => ({
  id: r.id, campaignId: r.campaign_id, name: r.name, handle: r.handle ?? '',
  email: r.email ?? '', whatsapp: r.whatsapp ?? '', deliverables: r.deliverables ?? '',
  fee: Number(r.fee ?? 0), token: r.token, createdAt: r.created_at,
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
    slug, agency_name: input.agencyName, agency_color: input.agencyColor,
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
