import { alreadyNudged, creatorsWithState, listCampaigns, logNudge, today } from './store';
import { nudgeEmailHtml, sendEmail } from './email';
import { formatBr } from './parse';

/** Régua de cobrança, em dias relativos ao prazo de comprovação. */
export const SCHEDULE: { offset: number; kind: string; tone: 'aviso' | 'lembrete' | 'atraso' }[] = [
  { offset: -2, kind: 'D-2', tone: 'aviso' },
  { offset: 0, kind: 'D0', tone: 'lembrete' },
  { offset: 1, kind: 'D+1', tone: 'atraso' },
  { offset: 3, kind: 'D+3', tone: 'atraso' },
  { offset: 7, kind: 'D+7', tone: 'atraso' },
];

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
}

export type NudgeRun = {
  date: string;
  checked: number;
  sent: { creator: string; kind: string; ok: boolean; reason?: string }[];
};

/**
 * O motor 24/7: roda 1×/dia, cobra quem falta, para sozinho quando o creator entrega.
 * Idempotente — rodar duas vezes no mesmo dia não manda e-mail duplicado.
 */
export async function runNudges(baseUrl: string, now = today()): Promise<NudgeRun> {
  const run: NudgeRun = { date: now, checked: 0, sent: [] };
  const campaigns = await listCampaigns();

  for (const campaign of campaigns) {
    const creators = await creatorsWithState(campaign.id);
    for (const creator of creators) {
      run.checked++;
      if (creator.submission) continue;              // entregou: régua encerrada
      if (!creator.email) continue;                  // sem e-mail: só cobrança manual via WhatsApp

      const step = SCHEDULE.find((s) => addDays(campaign.proofDeadline, s.offset) === now);
      if (!step) continue;
      if (await alreadyNudged(creator.id, step.kind)) continue;

      const link = `${baseUrl}/e/${creator.token}`;
      const res = await sendEmail({
        to: creator.email,
        subject:
          step.tone === 'atraso'
            ? `Falta a sua comprovação — ${campaign.brand}`
            : `Comprovação da campanha ${campaign.brand}`,
        html: nudgeEmailHtml({
          creatorName: creator.name,
          brand: campaign.brand,
          agencyName: campaign.agencyName,
          deliverables: creator.deliverables,
          deadline: formatBr(campaign.proofDeadline),
          link,
          tone: step.tone,
        }),
      });

      await logNudge(creator.id, step.kind);
      run.sent.push({ creator: creator.name, kind: step.kind, ok: res.sent, reason: res.reason });
    }
  }
  return run;
}
