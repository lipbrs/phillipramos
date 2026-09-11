import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Prospector — PubliProva",
  description: "Painel do sistema comercial do @publiprova.app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="envolucro">
          <header className="topo">
            <h1>Prospector · @publiprova.app</h1>
            <nav>
              <a href="/">Painel</a>
              <a href="/excecoes">Precisa de você</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
