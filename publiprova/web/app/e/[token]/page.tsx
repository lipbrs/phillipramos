import { notFound } from 'next/navigation';
import { getByToken } from '@/lib/store';
import { formatBr } from '@/lib/parse';
import SubmitForm from './SubmitForm';

export const dynamic = 'force-dynamic';

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { token } = await params;
  const { ok } = await searchParams;
  const found = await getByToken(token);
  if (!found) notFound();

  const { creator, campaign, submission } = found;
  const done = Boolean(submission);

  return (
    <main className="wrap narrow" style={{ padding: '48px 20px 72px' }}>
      <p className="eyebrow" style={{ background: 'var(--brand-soft)' }}>{campaign.agencyName}</p>
      <h1 style={{ fontSize: '1.7rem' }}>
        {done ? 'Entrega registrada ✅' : `Oi, ${creator.name.split(' ')[0]}!`}
      </h1>

      {done ? (
        <div className="stack">
          <p className="muted">
            Recebemos a comprovação da campanha <strong>{campaign.brand}</strong> em{' '}
            {new Date(submission!.submittedAt).toLocaleString('pt-BR')}. A agência já foi avisada e os
            lembretes pararam.
          </p>
          <div className="card">
            <h3>O que você enviou</h3>
            <p className="small" style={{ wordBreak: 'break-all', margin: '0 0 10px' }}>
              <a href={submission!.postUrl} target="_blank" rel="noreferrer">{submission!.postUrl}</a>
            </p>
            <div className="row">
              {Object.entries(submission!.metrics).map(([k, v]) => (
                <span className="badge badge-brand" key={k}>{k}: {Number(v).toLocaleString('pt-BR')}</span>
              ))}
            </div>
          </div>
          {ok === '1' && <p className="small muted">Pode fechar esta página. Obrigado! 🙌</p>}
        </div>
      ) : (
        <>
          <p className="muted">
            Faltou só a comprovação da campanha <strong>{campaign.brand}</strong>. Leva menos de um
            minuto e não precisa de cadastro.
          </p>

          <div className="card-soft" style={{ marginBottom: 26 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>Combinado:</strong> {creator.deliverables}<br />
              <strong>Prazo:</strong> {formatBr(campaign.proofDeadline)}
            </p>
            {campaign.briefing && (
              <p className="small muted" style={{ margin: '10px 0 0' }}>{campaign.briefing}</p>
            )}
          </div>

          <SubmitForm token={token} />
        </>
      )}
    </main>
  );
}
