import type { Creator } from './types';

/**
 * Aceita a lista colada direto da planilha da agência.
 * Formato por linha (tab, ponto-e-vírgula ou vírgula):
 *   Nome ; @handle ; email ; whatsapp ; entregáveis ; cachê
 * Só o nome é obrigatório — agência raramente tem a planilha completa.
 */
export function parseCreators(raw: string): Omit<Creator, 'id' | 'campaignId' | 'token' | 'createdAt'>[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !/^nome\s*[;,\t]/i.test(l)) // descarta cabeçalho
    .map((line) => {
      const cols = line.split(/\t|;|,/).map((c) => c.trim());
      const [name = '', handle = '', email = '', whatsapp = '', deliverables = '', fee = ''] = cols;
      return {
        name,
        handle: handle.replace(/^@/, ''),
        email,
        whatsapp: whatsapp.replace(/\D/g, ''),
        deliverables: deliverables || '1 post',
        fee: parseFee(fee),
      };
    })
    .filter((c) => c.name.length > 0);
}

function parseFee(v: string): number {
  if (!v) return 0;
  const n = Number(v.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Mensagem pronta de cobrança + link wa.me — custo zero, sem API do WhatsApp. */
export function whatsappNudge(opts: {
  creatorName: string;
  brand: string;
  deadline: string;
  link: string;
  whatsapp: string;
}): string {
  const text = [
    `Oi ${opts.creatorName.split(' ')[0]}! Tudo bem?`,
    ``,
    `Passando pra pegar a comprovação da campanha ${opts.brand}.`,
    `É rapidinho e não precisa de cadastro — é só colar o link do post e subir o print dos insights:`,
    opts.link,
    ``,
    `Prazo: ${formatBr(opts.deadline)}. Qualquer dúvida me chama!`,
  ].join('\n');
  const phone = opts.whatsapp.replace(/\D/g, '');
  const base = phone ? `https://wa.me/${phone.length <= 11 ? '55' + phone : phone}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function formatBr(iso: string): string {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function token(len = 22): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
