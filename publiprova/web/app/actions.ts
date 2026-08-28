'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createCampaign, getByToken, savePrint, saveSubmission } from '@/lib/store';
import { parseCreators, token as newToken } from '@/lib/parse';
import { checkCreateAllowed } from '@/lib/plans';
import { currentAgency, logout, requestLoginLink, SESSION_COOKIE } from '@/lib/auth';
import type { Metrics } from '@/lib/types';

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

async function baseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/* ------------------------------ login ------------------------------ */

export async function requestLoginAction(fd: FormData) {
  const result = await requestLoginLink(str(fd, 'email'), await baseUrl());
  if (!result.ok) redirect(`/login?erro=${encodeURIComponent(result.reason)}`);
  if (result.devLink) redirect(`/login?dev=${encodeURIComponent(result.devLink)}`);
  redirect('/login?enviado=1');
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}

/* ---------------------------- campanhas ---------------------------- */

export async function createCampaignAction(fd: FormData) {
  const agency = await currentAgency();
  if (!agency) redirect('/login');

  const creators = parseCreators(str(fd, 'creators'));
  if (creators.length === 0) {
    redirect(`/app?erro=${encodeURIComponent('Cole pelo menos um creator na lista.')}`);
  }

  const blocked = await checkCreateAllowed(agency.id, agency.plan, creators.length);
  if (blocked) redirect(`/app?erro=${encodeURIComponent(blocked)}`);

  const postDeadline = str(fd, 'postDeadline');
  const proofDeadline = str(fd, 'proofDeadline') || postDeadline;

  const campaign = await createCampaign(
    {
      agencyId: agency.id,
      agencyName: str(fd, 'agencyName') || agency.name,
      agencyColor: str(fd, 'agencyColor') || agency.color,
      client: str(fd, 'client'),
      brand: str(fd, 'brand'),
      briefing: str(fd, 'briefing'),
      postDeadline,
      proofDeadline,
    },
    creators,
  );

  revalidatePath('/app');
  redirect(`/app/c/${campaign.id}`);
}

/* --------------------------- comprovação --------------------------- */

const METRIC_FIELDS: (keyof Metrics)[] =
  ['reach', 'impressions', 'views', 'likes', 'comments', 'saves', 'shares', 'linkClicks'];

const PRINT_MAX_BYTES = 6 * 1024 * 1024;
const PRINT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function submitProofAction(fd: FormData) {
  const tk = str(fd, 'token');
  const found = await getByToken(tk);
  if (!found) throw new Error('Link inválido ou expirado.');

  const postUrl = str(fd, 'postUrl');
  if (!/^https?:\/\/\S+\.\S+/.test(postUrl)) throw new Error('Cole o link completo do post publicado.');

  const metrics: Metrics = {};
  for (const k of METRIC_FIELDS) {
    const raw = str(fd, k).replace(/\./g, '').replace(',', '.');
    if (!raw) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) metrics[k] = Math.round(n);
  }

  // O print original fica guardado — é o registro auditável da entrega.
  let screenshotUrl: string | null = null;
  const file = fd.get('screenshotFile');
  if (file instanceof File && file.size > 0 && file.size <= PRINT_MAX_BYTES) {
    const type = PRINT_TYPES.includes(file.type) ? file.type : 'image/png';
    const printId = `${found.creator.id}-${newToken(8)}`;
    await savePrint(printId, Buffer.from(await file.arrayBuffer()), type);
    screenshotUrl = `/api/prints/${printId}`;
  }

  await saveSubmission({
    creatorId: found.creator.id,
    postUrl,
    screenshotUrl,
    metrics,
    extractedByAi: str(fd, 'extractedByAi') === '1',
  });

  revalidatePath(`/e/${tk}`);
  revalidatePath(`/app/c/${found.campaign.id}`);
  redirect(`/e/${tk}?ok=1`);
}

/* --------------- login instantâneo do modo demonstração ------------ */

export async function demoLoginAction() {
  const { usingSupabase, DEMO_AGENCY_ID, createSession } = await import('@/lib/store');
  if (usingSupabase) redirect('/login');
  const session = await createSession(DEMO_AGENCY_ID);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  redirect('/app');
}
