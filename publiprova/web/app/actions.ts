'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createCampaign, getByToken, saveSubmission } from '@/lib/store';
import { parseCreators } from '@/lib/parse';
import type { Metrics } from '@/lib/types';

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function createCampaignAction(fd: FormData) {
  const creators = parseCreators(str(fd, 'creators'));
  if (creators.length === 0) throw new Error('Cole pelo menos um creator na lista.');

  const postDeadline = str(fd, 'postDeadline');
  const proofDeadline = str(fd, 'proofDeadline') || postDeadline;

  const campaign = await createCampaign(
    {
      agencyName: str(fd, 'agencyName') || 'Minha agência',
      agencyColor: str(fd, 'agencyColor') || '#4f46e5',
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

const METRIC_FIELDS: (keyof Metrics)[] =
  ['reach', 'impressions', 'views', 'likes', 'comments', 'saves', 'shares', 'linkClicks'];

export async function submitProofAction(fd: FormData) {
  const token = str(fd, 'token');
  const found = await getByToken(token);
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

  await saveSubmission({
    creatorId: found.creator.id,
    postUrl,
    screenshotUrl: str(fd, 'screenshotUrl') || null,
    metrics,
    extractedByAi: str(fd, 'extractedByAi') === '1',
  });

  revalidatePath(`/e/${token}`);
  revalidatePath(`/app/c/${found.campaign.id}`);
  redirect(`/e/${token}?ok=1`);
}
