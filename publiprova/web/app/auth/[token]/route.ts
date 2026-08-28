import { NextResponse } from 'next/server';
import { loginWithToken, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await loginWithToken(token);
  const url = new URL(req.url);

  if (!session) {
    return NextResponse.redirect(
      new URL(`/login?erro=${encodeURIComponent('Link inválido ou expirado. Peça um novo.')}`, url),
    );
  }

  const res = NextResponse.redirect(new URL('/app', url));
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    secure: url.protocol === 'https:',
  });
  return res;
}
