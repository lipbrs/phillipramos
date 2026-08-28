import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listCampaignsByAgency, creatorsWithState, usingSupabase } from '@/lib/store';
import { totals } from '@/lib/metrics';
import { formatBr } from '@/lib/parse';
import { currentAgency } from '@/lib/auth';
import { PLANS, planUsage } from '@/lib/plans';
import { createCampaignAction, logoutAction } from '../actions';

export const dynamic = 'force-dynamic';

function iso(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const agency = await currentAgency();
  if (!agency) redirect('/login');

  const { erro } = await searchParams;
  const campaigns = await listCampaignsByAgency(agency.id);
  const [rows, usage] = await Promise.all([
    Promise.all(campaigns.map(async (c) => ({ campaign: c, t: totals(await creatorsWithState(c.id)) }))),
    planUsage(agency.id, agency.plan),
  ]);
  const plan = PLANS[agency.plan] ?? PLANS.free;

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="logo">Publi<span>Prova</span></Link>
          <div className="row">
            <span className="badge badge-brand">
              {plan.label} · {usage.creatorsThisMonth}/{usage.creatorsPerMonth} creators no mês
            </span>
            {!usingSupabase && <span className="badge badge-warn">demonstração</span>}
            <form action={logoutAction}>
              <button className="btn btn-ghost btn-sm" type="submit">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="wrap section">
        <div className="spread" style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: '1.9rem', margin: 0 }}>Suas campanhas</h1>
          <span className="small muted">{agency.email}</span>
        </div>

        {erro && (
          <div className="card" style={{ borderColor: 'var(--late)', margin: '16px 0' }}>
            <p className="small" style={{ margin: 0, color: 'var(--late)' }}>{erro}</p>
          </div>
        )}

        {rows.length === 0 && (
          <p className="muted">Nenhuma campanha ainda. Crie a primeira aqui embaixo.</p>
        )}

        <div className="stack" style={{ margin: '16px 0 48px' }}>
          {rows.map(({ campaign, t }) => (
            <Link key={campaign.id} href={`/app/c/${campaign.id}`} className="card spread" style={{ textDecoration: 'none' }}>
              <div>
                <h3 style={{ margin: 0 }}>{campaign.brand}</h3>
                <p className="small muted" style={{ margin: '4px 0 0' }}>
                  {campaign.client} · comprovação até {formatBr(campaign.proofDeadline)}
                </p>
              </div>
              <div className="row">
                <span className="badge badge-ok">{t.proven} comprovados</span>
                {t.pending > 0 && <span className="badge badge-warn">{t.pending} pendentes</span>}
                {t.late > 0 && <span className="badge badge-late">{t.late} atrasados</span>}
              </div>
            </Link>
          ))}
        </div>

        <section className="card">
          <h2 style={{ fontSize: '1.25rem' }}>Nova campanha</h2>
          <p className="small muted">
            Cole a lista direto da sua planilha. Uma linha por creator, separado por tabulação,
            ponto-e-vírgula ou vírgula: <code>Nome ; @handle ; e-mail ; whatsapp ; entregáveis ; cachê</code>.
            Só o nome é obrigatório.
          </p>

          <form action={createCampaignAction} style={{ marginTop: 18 }}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="brand">Marca / campanha</label>
                <input id="brand" name="brand" required placeholder="Verão Hidrata" />
              </div>
              <div className="field">
                <label htmlFor="client">Cliente</label>
                <input id="client" name="client" required placeholder="Nome do cliente" />
              </div>
              <div className="field">
                <label htmlFor="agencyName">Sua agência</label>
                <input id="agencyName" name="agencyName" defaultValue={agency.name} />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="postDeadline">Prazo de postagem</label>
                <input id="postDeadline" name="postDeadline" type="date" defaultValue={iso(5)} required />
              </div>
              <div className="field">
                <label htmlFor="proofDeadline">Prazo de comprovação</label>
                <input id="proofDeadline" name="proofDeadline" type="date" defaultValue={iso(7)} required />
              </div>
              <div className="field">
                <label htmlFor="agencyColor">Cor da marca no relatório</label>
                <input id="agencyColor" name="agencyColor" type="color" defaultValue={agency.color} style={{ padding: 4, height: 42 }} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="briefing">Briefing (aparece para o creator)</label>
              <textarea id="briefing" name="briefing" placeholder="1 Reel de 30s + 2 Stories com link na bio." />
            </div>

            <div className="field">
              <label htmlFor="creators">Creators</label>
              <textarea
                id="creators"
                name="creators"
                required
                style={{ minHeight: 140, fontFamily: 'ui-monospace, monospace', fontSize: '.85rem' }}
                defaultValue={'Ana Ribeiro; @anaribeiro; ana@exemplo.com; 11999990000; 1 Reel + 2 Stories; 800\nBruno Tavares; @brunotv; bruno@exemplo.com; 11988880000; 1 Reel; 1200'}
              />
            </div>

            <button className="btn" type="submit">Criar campanha e gerar os links</button>
            <p className="tiny muted" style={{ marginTop: 10 }}>
              Plano {plan.label}: até {usage.creatorsPerMonth} creators/mês
              {Number.isFinite(usage.activeCampaignsLimit) ? ` e ${usage.activeCampaignsLimit} campanha(s) ativa(s)` : ''}.
              O limite vale só na criação — campanha em andamento nunca é travada.
            </p>
          </form>
        </section>
      </main>
    </>
  );
}
