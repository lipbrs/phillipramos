import { NextResponse } from 'next/server';
import { extractMetrics } from '@/lib/extract';

export const dynamic = 'force-dynamic';
const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('screenshot');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, reason: 'envie uma imagem' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, reason: 'imagem acima de 6 MB' }, { status: 413 });
  }
  const mediaType = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    ? file.type
    : 'image/png';
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const result = await extractMetrics(base64, mediaType);
  return NextResponse.json(result);
}
