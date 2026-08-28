'use client';
import { useState } from 'react';

export default function CopyLink({ url, label = 'Copiar link' }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt('Copie o link:', url);
        }
      }}
    >
      {done ? 'copiado ✓' : label}
    </button>
  );
}
