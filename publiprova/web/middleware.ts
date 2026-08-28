import { NextResponse, type NextRequest } from 'next/server';

/**
 * Porta de entrada do painel: sem cookie de sessão, vai para /login.
 * A validação real da sessão acontece nas páginas (currentAgency) —
 * aqui é só o redirecionamento barato, sem tocar no banco.
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get('pp_session')?.value) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
