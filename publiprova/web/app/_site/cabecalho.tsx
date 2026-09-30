import Link from 'next/link';

// Cabeçalho e rodapé das páginas de SITE (home, produto, segurança, sobre,
// privacidade). As rotas de PRODUTO (/app, /r, /e, /login) têm chrome próprio e
// não usam estes componentes de propósito: quem já está dentro não precisa de
// navegação de marketing.

const paginas = [
  { href: '/produto', rotulo: 'Produto' },
  { href: '/seguranca', rotulo: 'Segurança' },
  { href: '/sobre', rotulo: 'Sobre' },
];

export function Cabecalho({ atual, sobreCinema }: { atual?: string; sobreCinema?: boolean }) {
  return (
    <header className={sobreCinema ? 'topbar topbar-cine' : 'topbar'}>
      <div className="wrap">
        <div className="row" style={{ gap: 28 }}>
          <Link href="/" className="logo">Publi<span>Prova</span></Link>
          <nav className="nav" aria-label="Navegação principal">
            {paginas.map((p) => (
              <Link key={p.href} href={p.href} aria-current={atual === p.href ? 'page' : undefined}>
                {p.rotulo}
              </Link>
            ))}
          </nav>
        </div>
        <div className="row">
          <Link href="/r/verao-hidrata-demo" className="btn btn-ghost btn-sm">Ver relatório de exemplo</Link>
          <Link href="/app" className="btn btn-sm">Começar grátis</Link>
        </div>
      </div>
    </header>
  );
}

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="wrap rodape-grade">
        <div>
          <div className="logo" style={{ marginBottom: 10 }}>Publi<span>Prova</span></div>
          <p className="small muted" style={{ maxWidth: '34ch', margin: 0 }}>
            Comprovação de entregas em campanhas com creators. Feito no Brasil, para
            agências que fecham campanha todo mês.
          </p>
        </div>
        <div>
          <h4>Produto</h4>
          <ul>
            <li><Link href="/produto">Como funciona</Link></li>
            <li><Link href="/r/verao-hidrata-demo">Relatório de exemplo</Link></li>
            <li><Link href="/#precos">Preços</Link></li>
            <li><Link href="/app">Começar grátis</Link></li>
          </ul>
        </div>
        <div>
          <h4>Confiança</h4>
          <ul>
            <li><Link href="/seguranca">Segurança e dados</Link></li>
            <li><Link href="/privacidade">Política de Privacidade</Link></li>
            <li><Link href="/sobre">Quem faz</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contato</h4>
          <ul>
            <li><a href="mailto:publiprova@gmail.com">publiprova@gmail.com</a></li>
            <li>
              <a href="https://www.instagram.com/publiprova.app/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="wrap rodape-base">
        PubliProva · atendimento em português, para agências no Brasil · respondemos em até 1 dia útil
      </div>
    </footer>
  );
}
