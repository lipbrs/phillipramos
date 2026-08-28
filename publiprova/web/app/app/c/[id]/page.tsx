import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { creatorsWithState, getCampaign } from '@/lib/store';
import { currentAgency } from '@/lib/auth';
import { brl, num, pct, totals, engagement, reachBase } from '@/lib/metrics';
import { formatBr, whatsappNudge } from '@/lib/parse';
import { SCHEDULE } from '@/lib/nudges';
import CopyLink from './CopyLink';

export const dynamic = 'force-dynamic';

async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

const badgeClass = { comprovado: 'badge-ok', pendente: 'badge-warn', atrasado: 'badge-late' } as const;

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [agency, campaign] = await Promise.all([currentAgency(), getCampaign(id)]);
  if (!agency) notFound();
  if (!campaign || campaign.agencyId !== agency.id) notFound();

  const creators = await creatorsWithState(id);
  const t = totals(creators);
  const base = await baseUrl();

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link href="/app" className="logo">Publi<span>Prova</span></Link>
          <Link href={`/r/${campaign.slug}`} className="btn btn-sm">Relatório do cliente →</Link>
        </div>
      </header>

      <main className="wrap section">
        <div className="spread">
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>{campaign.brand}</h1>
            <p className="muted small" style={{ margin: 0 }}>
              {campaign.client} · postagem até {formatBr(campaign.postDeadline)} · comprovação até {formatBr(campaign.proofDeadline)}
            </p>
          </div>
          <CopyLink url={`${base}/r/${campaign.slug}`} label="Copiar link do relatório" />
        </div>

        <div className="grid grid-4" style={{ margin: '28px 0' }}>
          <div className="stat">
            <div className="stat-value">{t.proven}/{t.creators}</div>
            <div className="stat-label">comprovados · {pct(t.submissionRate)}</div>
          </div>
          <div className="stat">
            <div className="stat-value">{num(t.impressions)}</div>
            <div className="stat-label">impressões</div>
          </div>
          <div className="stat">
            <div className="stat-value">{num(t.engagement)}</div>
            <div className="stat-label">engajamento</div>
          </div>
          <div className="stat">
            <div className="stat-value">{t.cpm == null ? '—' : brl(t.cpm)}</div>
            <div className="stat-label">CPM · investido {brl(t.fee)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Entregáveis</th>
                  <th>Status</th>
                  <th className="num">Alcance</th>
                  <th className="num">Engaj.</th>
                  <th className="num">Cachê</th>
                  <th>Cobrar</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => {
                  const link = `${base}/e/${c.token}`;
                  const m = c.submission?.metrics;
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        {c.handle && <div className="tiny muted">@{c.handle}</div>}
                      </td>
                      <td className="small muted">{c.deliverables}</td>
                      <td>
                        <span className={`badge ${badgeClass[c.status]}`}>{c.status}</span>
                        {c.daysLate > 0 && <div className="tiny muted">{c.daysLate}d de atraso</div>}
                      </td>
                      <td className="num">
                        {m ? num(reachBase(m)) : '—'}
                        {c.submission?.screenshotUrl && (
                          <div className="tiny">
                            <a href={c.submission.screenshotUrl} target="_blank" rel="noreferrer">print ↗</a>
                          </div>
                        )}
                      </td>
                      <td className="num">{m ? num(engagement(m)) : '—'}</td>
                      <td className="num">{brl(c.fee)}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <CopyLink url={link} label="link" />
                          {c.status !== 'comprovado' && (
                            <a
                              className="btn btn-ghost btn-sm"
                              target="_blank"
                              rel="noreferrer"
                              href={whatsappNudge({
                                creatorName: c.name,
                                brand: campaign.brand,
                                deadline: campaign.proofDeadline,
                                link,
                                whatsapp: c.whatsapp,
                              })}
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-soft" style={{ marginTop: 28 }}>
          <h3>Cobrança automática</h3>
          <p className="small muted" style={{ marginBottom: 8 }}>
            A régua roda 1×/dia por e-mail e para sozinha assim que o creator envia. Etapas relativas
            ao prazo de comprovação ({formatBr(campaign.proofDeadline)}):
          </p>
          <div className="row">
            {SCHEDULE.map((s) => <span key={s.kind} className="badge badge-brand">{s.kind}</span>)}
          </div>
        </div>
      </main>
    </>
  );
}
