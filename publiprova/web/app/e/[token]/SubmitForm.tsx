'use client';

import { useState } from 'react';
import { submitProofAction } from '../../actions';
import type { Metrics } from '@/lib/types';

const FIELDS: { key: keyof Metrics; label: string }[] = [
  { key: 'reach', label: 'Contas alcançadas' },
  { key: 'impressions', label: 'Impressões' },
  { key: 'views', label: 'Reproduções' },
  { key: 'likes', label: 'Curtidas' },
  { key: 'comments', label: 'Comentários' },
  { key: 'saves', label: 'Salvamentos' },
  { key: 'shares', label: 'Compartilhamentos' },
  { key: 'linkClicks', label: 'Cliques no link' },
];

export default function SubmitForm({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<Metrics>({});
  const [reading, setReading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReading(true);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append('screenshot', file);
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        setMetrics(data.metrics as Metrics);
        setAiUsed(true);
        setNote('Li os números do print — confere se está tudo certo antes de enviar.');
      } else {
        setNote(`Não deu pra ler automaticamente (${data.reason}). Pode digitar os números abaixo.`);
      }
    } catch {
      setNote('Não deu pra ler automaticamente. Pode digitar os números abaixo.');
    } finally {
      setReading(false);
    }
  }

  return (
    <form action={submitProofAction} className="stack">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="extractedByAi" value={aiUsed ? '1' : '0'} />

      <div className="field">
        <label htmlFor="postUrl">1. Link do post publicado</label>
        <input
          id="postUrl"
          name="postUrl"
          required
          inputMode="url"
          placeholder="https://www.instagram.com/p/..."
        />
      </div>

      <div className="field">
        <label htmlFor="screenshot">2. Print dos insights</label>
        <input id="screenshot" type="file" accept="image/*" onChange={onFile} />
        <p className="tiny muted" style={{ margin: '6px 0 0' }}>
          {reading ? 'Lendo o print…' : 'A imagem é lida no envio e os números aparecem preenchidos abaixo.'}
        </p>
      </div>

      {note && <p className="small" style={{ color: 'var(--brand)' }}>{note}</p>}

      <div>
        <label>3. Confira os números</label>
        <div className="field-row">
          {FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={f.key}>{f.label}</label>
              <input
                id={f.key}
                name={f.key}
                inputMode="numeric"
                value={metrics[f.key] ?? ''}
                onChange={(e) =>
                  setMetrics((m) => ({ ...m, [f.key]: e.target.value === '' ? undefined : Number(e.target.value.replace(/\D/g, '')) }))
                }
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      <button className="btn" type="submit" disabled={reading}>Enviar minha comprovação</button>
      <p className="tiny muted">
        Preencha só o que aparecer no seu print. Campo em branco fica registrado como não informado.
      </p>
    </form>
  );
}
