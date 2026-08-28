import { NextResponse } from 'next/server';
import { getPrint } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * Serve o print original da comprovação.
 * O id contém um sufixo aleatório — só quem tem o link (painel/relatório) chega aqui.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{6,80}$/.test(id)) return new NextResponse('não encontrado', { status: 404 });

  const print = await getPrint(id);
  if (!print) return new NextResponse('não encontrado', { status: 404 });

  if (print.kind === 'url') return NextResponse.redirect(print.url);
  return new NextResponse(new Uint8Array(print.data), {
    headers: { 'content-type': print.type, 'cache-control': 'private, max-age=300' },
  });
}
