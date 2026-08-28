import { creatorsWithState, getCampaignBySlug } from '@/lib/store';
import { engagement, reachBase } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return new Response('não encontrado', { status: 404 });

  const creators = await creatorsWithState(campaign.id);
  const header = [
    'creator', 'handle', 'entregaveis', 'status', 'link_do_post', 'enviado_em',
    'alcance', 'impressoes', 'curtidas', 'comentarios', 'salvos', 'compartilhamentos',
    'cliques', 'engajamento', 'cache',
  ];

  const lines = creators.map((c) => {
    const m = c.submission?.metrics ?? {};
    return [
      c.name, c.handle, c.deliverables, c.status,
      c.submission?.postUrl ?? '', c.submission?.submittedAt ?? '',
      m.reach ?? '', reachBase(m) || '', m.likes ?? '', m.comments ?? '',
      m.saves ?? '', m.shares ?? '', m.linkClicks ?? '',
      c.submission ? engagement(m) : '', c.fee,
    ].map(esc).join(',');
  });

  return new Response([header.map(esc).join(','), ...lines].join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${campaign.slug}.csv"`,
    },
  });
}
