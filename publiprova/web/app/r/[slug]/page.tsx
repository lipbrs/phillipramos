import { notFound } from 'next/navigation';
import { creatorsWithState, getCampaignBySlug } from '@/lib/store';
import { brl, engagement, num, pct, reachBase, totals } from '@/lib/metrics';
import { formatBr } from '@/lib/parse';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const creators = await creatorsWithState(campaign.id);
  const proven = creators.filter((c) => c.status === 'comprovado');
  const t = totals(creators);

  return (
    <main className="wrap" style={{ padding: '40px 20px 72px' }}>
      <div className="spread" style={{ borderBottom: `3px solid ${campaign.agencyColor}`, paddingBottom: 16 }}>
        <div>
          <p className="tiny muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Relatório de campanha · {campaign.agencyName}
          </p>
          <h1 style={{ fontSize: '1.9rem', margin: '6px 0 2px' }}>{campaign.brand}</h1>
          <p className="small muted" style={{ margin: 0 }}>
            {campaign.client} · período até {formatBr(campaign.postDeadline)}
          </p>
        </div>
        <PrintButton />
      </div>

      <section className="grid grid-4" style={{ margin: '28px 0' }}>
        <div className="stat">
          <div className="stat-value">{num(t.impressions)}</div>
          <div className="stat-label">impressões</div>
        </div>
        <div className="stat">
          <div className="stat-value">{num(t.reach)}</div>
          <div className="stat-label">alcance</div>
        </div>
        <div className="stat">
          <div className="stat-value">{num(t.engagement)}</div>
          <div className="stat-label">engajamento</div>
        </div>
        <div className="stat">
          <div className="stat-value">{t.cpm == null ? '—' : brl(t.cpm)}</div>
          <div className="stat-label">CPM</div>
        </div>
        <div className="stat">
          <div className="stat-value">{t.cpe == null ? '—' : brl(t.cpe)}</div>
          <div className="stat-label">custo por engajamento</div>
        </div>
        <div className="stat">
          <div className="stat-value">{num(t.linkClicks)}</div>
          <div className="stat-label">cliques no link</div>
        </div>
        <div className="stat">
          <div className="stat-value">{brl(t.fee)}</div>
          <div className="stat-label">investimento em creators</div>
        </div>
        <div className="stat">
          <div className="stat-value">{t.proven}/{t.creators}</div>
          <div className="stat-label">entregas comprovadas · {pct(t.submissionRate)}</div>
        </div>
      </section>

      <h2 style={{ fontSize: '1.2rem' }}>Entregas por creator</h2>
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        {proven.map((c) => {
          const m = c.submission!.metrics;
          return (
            <article className="card" key={c.id}>
              <div className="spread" style={{ marginBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{c.name}</h3>
                  {c.handle && <span className="tiny muted">@{c.handle}</span>}
                </div>
                <span className="badge badge-ok">comprovado</span>
              </div>
              <p className="tiny muted" style={{ margin: '0 0 10px' }}>{c.deliverables}</p>
              <table style={{ fontSize: '.82rem' }}>
                <tbody>
                  <tr><td style={{ padding: '5px 0' }}>Alcance</td><td className="num" style={{ textAlign: 'right', padding: '5px 0' }}>{num(reachBase(m))}</td></tr>
                  <tr><td style={{ padding: '5px 0' }}>Engajamento</td><td className="num" style={{ textAlign: 'right', padding: '5px 0' }}>{num(engagement(m))}</td></tr>
                  <tr><td style={{ padding: '5px 0' }}>Cliques</td><td className="num" style={{ textAlign: 'right', padding: '5px 0' }}>{num(m.linkClicks)}</td></tr>
                  <tr><td style={{ padding: '5px 0', border: 0 }}>Cachê</td><td className="num" style={{ textAlign: 'right', padding: '5px 0', border: 0 }}>{brl(c.fee)}</td></tr>
                </tbody>
              </table>
              <p className="tiny" style={{ margin: '10px 0 0', wordBreak: 'break-all' }}>
                <a href={c.submission!.postUrl} target="_blank" rel="noreferrer">ver post publicado ↗</a>
              </p>
            </article>
          );
        })}
      </div>

      {t.pending + t.late > 0 && (
        <p className="small muted" style={{ marginTop: 24 }}>
          {t.pending + t.late} entrega(s) ainda sem comprovação nesta data. O relatório é atualizado
          automaticamente conforme os creators enviam.
        </p>
      )}

      <footer className="tiny muted no-print" style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <a href={`/r/${campaign.slug}/csv`}>Baixar CSV</a> · Comprovações registradas com data, hora e
        link do post publicado · feito com PubliProva
      </footer>
    </main>
  );
}
