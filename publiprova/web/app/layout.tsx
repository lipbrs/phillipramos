import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

// Geist no lugar da pilha do sistema: a fonte é o maior ganho visual por unidade
// de risco num redesenho. Carregada pelo next/font, que auto-hospeda e evita o
// <link> para o Google em produção.
const geist = Geist({ subsets: ['latin'], display: 'swap', variable: '--fonte' });

export const metadata: Metadata = {
  title: 'PubliProva - pare de cobrar print no WhatsApp',
  description:
    'Coleta e comprovação de entregas de campanhas com creators. Cada creator recebe um link, a cobrança roda sozinha e o relatório do cliente sai pronto.',
  metadataBase: new URL('https://publiprova.com.br'),
  openGraph: {
    title: 'PubliProva - pare de cobrar print no WhatsApp',
    description:
      'Cada creator recebe um link, a cobrança roda sozinha e o relatório do cliente sai pronto.',
    url: 'https://publiprova.com.br',
    siteName: 'PubliProva',
    locale: 'pt_BR',
    type: 'website',
    images: ['/painel.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
