import { NextResponse, type NextRequest } from 'next/server';

/**
 * Porta de entrada do painel da agência.
 *
 * MVP: um código de acesso por variável de ambiente (AGENCY_ACCESS_CODE).
 * É deliberadamente simples e serve para as primeiras contas concierge.
 * Antes de abrir cadastro público, trocar por Supabase Auth (magic link) —
 * o passo a passo está em docs/03-ideia-para-software.md.
 *
 * Sem AGENCY_ACCESS_CODE definido, /app fica aberto (modo demonstração local).
 */
export function middleware(req: NextRequest) {
  const code = process.env.AGENCY_ACCESS_CODE;
  if (!code) return NextResponse.next();

  const url = new URL(req.url);
  const provided = url.searchParams.get('code') ?? req.cookies.get('pp_access')?.value;
  if (provided === code) {
    const res = NextResponse.next();
    if (url.searchParams.has('code')) {
      res.cookies.set('pp_access', code, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
    }
    return res;
  }
  return new NextResponse('Acesso restrito. Abra /app?code=SEU_CODIGO', { status: 401 });
}

export const config = { matcher: ['/app/:path*'] };
