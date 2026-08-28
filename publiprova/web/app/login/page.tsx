import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentAgency } from '@/lib/auth';
import { usingSupabase } from '@/lib/store';
import { demoLoginAction, requestLoginAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; enviado?: string; dev?: string }>;
}) {
  if (await currentAgency()) redirect('/app');
  const { erro, enviado, dev } = await searchParams;

  return (
    <main className="wrap narrow" style={{ padding: '72px 20px' }}>
      <Link href="/" className="logo">Publi<span>Prova</span></Link>
      <h1 style={{ fontSize: '1.8rem', marginTop: 28 }}>Entrar no painel</h1>
      <p className="muted">
        Sem senha: você recebe um link de acesso por e-mail. O link vale por 15 minutos e só
        funciona uma vez.
      </p>

      {erro && (
        <div className="card" style={{ borderColor: 'var(--late)', marginBottom: 16 }}>
          <p className="small" style={{ margin: 0, color: 'var(--late)' }}>{erro}</p>
        </div>
      )}

      {enviado ? (
        <div className="card">
          <h3>Confira seu e-mail 📬</h3>
          <p className="small muted" style={{ margin: 0 }}>
            Enviamos o link de acesso. Se não chegar em 2 minutos, olhe o spam.
          </p>
        </div>
      ) : (
        <form action={requestLoginAction} className="card">
          <div className="field">
            <label htmlFor="email">E-mail da agência</label>
            <input id="email" name="email" type="email" required placeholder="voce@suaagencia.com.br" />
          </div>
          <button className="btn" type="submit">Enviar link de acesso</button>
        </form>
      )}

      {dev && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--brand)' }}>
          <h3>Modo demonstração</h3>
          <p className="small muted">
            Sem banco configurado o link não vai por e-mail — ele aparece aqui:
          </p>
          <a className="btn btn-sm" href={dev}>Abrir link mágico →</a>
        </div>
      )}

      {!usingSupabase && !dev && (
        <form action={demoLoginAction} style={{ marginTop: 20 }}>
          <button className="btn btn-ghost" type="submit">
            Entrar na conta de demonstração →
          </button>
        </form>
      )}
    </main>
  );
}
