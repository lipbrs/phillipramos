import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PubliProva — pare de cobrar print no WhatsApp',
  description:
    'Coleta e comprovação de entregas de campanhas com creators. Cada creator recebe um link, a cobrança roda sozinha e o relatório do cliente sai pronto.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
