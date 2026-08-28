import type { Metrics } from './types';

/**
 * Lê o print dos insights e devolve as métricas estruturadas.
 * Sem ANTHROPIC_API_KEY o app cai para digitação manual — nada quebra.
 * Custo real: ~US$ 0,004 por print (Haiku).
 */
export async function extractMetrics(
  imageBase64: string,
  mediaType: string,
): Promise<{ metrics: Metrics; ok: boolean; reason?: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { metrics: {}, ok: false, reason: 'sem chave de IA — preencha os campos à mão' };

  const prompt = `Você lê prints de insights de Instagram, TikTok e YouTube em português.
Extraia SOMENTE os números visíveis na imagem e responda com um JSON válido, sem texto em volta,
usando exatamente estas chaves (omita a chave se o número não aparecer no print):
{"reach":n,"impressions":n,"views":n,"likes":n,"comments":n,"saves":n,"shares":n,"linkClicks":n}
Regras: converta "12,3 mil" para 12300 e "1,2 mi" para 1200000. Nunca invente número.
"Contas alcançadas"=reach, "Impressões"/"Visualizações do perfil"=impressions,
"Reproduções"/"Visualizações"=views, "Salvamentos"=saves, "Compartilhamentos"=shares,
"Cliques no link"=linkClicks.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });
    if (!res.ok) return { metrics: {}, ok: false, reason: `IA indisponível (${res.status})` };

    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { metrics: {}, ok: false, reason: 'não consegui ler o print' };
    return { metrics: sanitize(JSON.parse(match[0])), ok: true };
  } catch (e) {
    return { metrics: {}, ok: false, reason: e instanceof Error ? e.message : 'erro na leitura' };
  }
}

const KEYS: (keyof Metrics)[] = ['reach', 'impressions', 'views', 'likes', 'comments', 'saves', 'shares', 'linkClicks'];

/** A IA sugere, o creator confirma. Nada entra sem passar por aqui. */
function sanitize(raw: unknown): Metrics {
  const out: Metrics = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const k of KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    const n = typeof v === 'string' ? Number(v.replace(/\D/g, '')) : v;
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n < 1e10) out[k] = Math.round(n);
  }
  return out;
}
