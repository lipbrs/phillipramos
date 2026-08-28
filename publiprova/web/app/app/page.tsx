import Link from 'next/link';
import { listCampaigns, creatorsWithState, usingSupabase } from '@/lib/store';
import { totals } from '@/lib/metrics';
import { formatBr } from '@/lib/parse';
import { createCampaignAction } from '../actions';

export const dynamic = 'force-dynamic';

function iso(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

export default async function Dashboard() {
  const campaigns = await listCampaigns();
  const rows = await Promise.all(
    campaigns.map(async (c) => ({ campaign: c, t: totals(await creatorsWithState(c.id)) })),
  );

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="logo">Publi<span>Prova</span></Link>
          <span className="badge badge-brand">{usingSupabase ? 'Supabase' : 'modo demonstração'}</span>
        </div>
      </header>

      <main className="wrap section">
        <h1 style={{ fontSize: '1.9rem' }}>Suas campanhas</h1>

        {rows.length === 0 && (
          <p className="muted">Nenhuma campanha ainda. Crie a primeira aqui embaixo.</p>
        )}

        <div className="stack" style={{ marginBottom: 48 }}>
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
                <input id="agencyName" name="agencyName" defaultValue="Minha agência" />
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
                <input id="agencyColor" name="agencyColor" type="color" defaultValue="#4f46e5" style={{ padding: 4, height: 42 }} />
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
          </form>
        </section>
      </main>
    </>
  );
}
