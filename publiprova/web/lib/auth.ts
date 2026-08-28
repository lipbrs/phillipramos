import { cookies } from 'next/headers';
import type { Agency } from './types';
import {
  consumeLoginToken, createLoginToken, createSession, deleteSession,
  getOrCreateAgencyByEmail, getSessionAgency, usingSupabase,
} from './store';
import { sendEmail } from './email';

export const SESSION_COOKIE = 'pp_session';

/**
 * Pede um link mágico de login.
 * - Produção (Supabase + Resend): o link vai por e-mail, e só por e-mail.
 * - Modo demonstração (memória): o link volta na resposta (`devLink`) para
 *   a tela mostrar — não há dado real para proteger nesse modo.
 */
export async function requestLoginLink(
  email: string,
  baseUrl: string,
): Promise<{ ok: true; devLink?: string } | { ok: false; reason: string }> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, reason: 'Digite um e-mail válido.' };
  }

  await getOrCreateAgencyByEmail(normalized);
  const tk = await createLoginToken(normalized);
  const link = `${baseUrl}/auth/${tk}`;

  if (!usingSupabase) return { ok: true, devLink: link };

  const res = await sendEmail({
    to: normalized,
    subject: 'Seu acesso ao PubliProva',
    html: `
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
  <p style="font-size:18px;font-weight:600;margin:0 0 16px">Entrar no PubliProva</p>
  <p style="margin:0 0 20px">Clique para acessar o painel da sua agência. O link vale por 15 minutos e só funciona uma vez.</p>
  <p style="margin:0 0 24px">
    <a href="${link}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">Entrar no painel</a>
  </p>
  <p style="color:#71717a;font-size:13px;margin:0">Se você não pediu este acesso, ignore este e-mail.</p>
</div>`.trim(),
  });
  if (!res.sent) {
    return { ok: false, reason: 'Envio de e-mail não configurado (RESEND_API_KEY). Configure para entrar.' };
  }
  return { ok: true };
}

/** Troca o token de login por uma sessão. Devolve o token da sessão ou null. */
export async function loginWithToken(tk: string): Promise<string | null> {
  const email = await consumeLoginToken(tk);
  if (!email) return null;
  const agency = await getOrCreateAgencyByEmail(email);
  return createSession(agency.id);
}

export async function currentAgency(): Promise<Agency | null> {
  const jar = await cookies();
  const tk = jar.get(SESSION_COOKIE)?.value ?? '';
  return tk ? getSessionAgency(tk) : null;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const tk = jar.get(SESSION_COOKIE)?.value;
  if (tk) await deleteSession(tk);
  jar.delete(SESSION_COOKIE);
}
