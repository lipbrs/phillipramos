import { NextResponse } from 'next/server';
import { runNudges } from '@/lib/nudges';

export const dynamic = 'force-dynamic';

/**
 * Agendar 1×/dia (GitHub Actions, Vercel Cron ou pg_cron do Supabase):
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-APP/api/cron/nudges
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 });
  }
  const baseUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const result = await runNudges(baseUrl);
  return NextResponse.json(result);
}
