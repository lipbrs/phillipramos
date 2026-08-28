import type { CreatorWithState, Metrics } from './types';

export function engagement(m: Metrics): number {
  return (m.likes ?? 0) + (m.comments ?? 0) + (m.saves ?? 0) + (m.shares ?? 0);
}

/** Base de alcance para CPM: impressões > visualizações > alcance. */
export function reachBase(m: Metrics): number {
  return m.impressions ?? m.views ?? m.reach ?? 0;
}

export type CampaignTotals = {
  creators: number;
  proven: number;
  pending: number;
  late: number;
  submissionRate: number; // 0..1
  reach: number;
  impressions: number;
  engagement: number;
  linkClicks: number;
  fee: number;
  cpm: number | null;     // custo por mil impressões
  cpe: number | null;     // custo por engajamento
};

export function totals(creators: CreatorWithState[]): CampaignTotals {
  const proven = creators.filter((c) => c.status === 'comprovado');
  const acc = proven.reduce(
    (a, c) => {
      const m = c.submission!.metrics;
      a.reach += m.reach ?? 0;
      a.impressions += reachBase(m);
      a.engagement += engagement(m);
      a.linkClicks += m.linkClicks ?? 0;
      a.fee += c.fee;
      return a;
    },
    { reach: 0, impressions: 0, engagement: 0, linkClicks: 0, fee: 0 },
  );

  return {
    creators: creators.length,
    proven: proven.length,
    pending: creators.filter((c) => c.status === 'pendente').length,
    late: creators.filter((c) => c.status === 'atrasado').length,
    submissionRate: creators.length ? proven.length / creators.length : 0,
    ...acc,
    cpm: acc.impressions > 0 ? (acc.fee / acc.impressions) * 1000 : null,
    cpe: acc.engagement > 0 ? acc.fee / acc.engagement : null,
  };
}

export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const num = (n: number | undefined | null) =>
  n == null ? '—' : n.toLocaleString('pt-BR');

export const pct = (n: number) =>
  `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
