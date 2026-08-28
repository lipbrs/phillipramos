/**
 * E-mail transacional via Resend (3.000/mês no plano gratuito).
 * Sem RESEND_API_KEY o envio vira log — o app continua funcionando em dev.
 */
export async function sendEmail(input: {
  to: string; subject: string; html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? 'PubliProva <nao-responda@publiprova.com.br>';
  if (!key) {
    console.info('[email:dry-run]', input.to, '—', input.subject);
    return { sent: false, reason: 'RESEND_API_KEY ausente (modo dry-run)' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
  });
  if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${await res.text()}` };
  return { sent: true };
}

export function nudgeEmailHtml(o: {
  creatorName: string; brand: string; agencyName: string; deliverables: string;
  deadline: string; link: string; tone: 'aviso' | 'lembrete' | 'atraso';
}): string {
  const head = {
    aviso: `Sua entrega da campanha ${o.brand} é em 2 dias`,
    lembrete: `Hoje é o prazo da campanha ${o.brand}`,
    atraso: `Falta só a sua comprovação da campanha ${o.brand}`,
  }[o.tone];

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
  <p style="font-size:18px;font-weight:600;margin:0 0 16px">${head}</p>
  <p style="margin:0 0 12px">Oi ${escapeHtml(o.creatorName.split(' ')[0])}! Aqui é a ${escapeHtml(o.agencyName)}.</p>
  <p style="margin:0 0 12px">Combinado: <strong>${escapeHtml(o.deliverables)}</strong>. Prazo de comprovação: <strong>${o.deadline}</strong>.</p>
  <p style="margin:0 0 20px">Pra fechar é só colar o link do post e subir o print dos insights. Não precisa de cadastro e leva menos de 1 minuto:</p>
  <p style="margin:0 0 24px">
    <a href="${o.link}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">Enviar minha comprovação</a>
  </p>
  <p style="color:#71717a;font-size:13px;margin:0">Se já enviou, pode ignorar — este lembrete para sozinho.</p>
</div>`.trim();
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
