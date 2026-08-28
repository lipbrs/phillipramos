import Link from 'next/link';

const steps = [
  {
    n: 1,
    title: 'Cole sua lista de creators',
    body: 'Nome, contato, entregáveis e cachê — direto da sua planilha. Trinta segundos.',
  },
  {
    n: 2,
    title: 'Cada creator recebe um link pessoal',
    body: 'Sem cadastro, sem app. Ele cola o link do post, sobe o print e a IA transforma em números. Quem não entregou é cobrado automaticamente até entregar.',
  },
  {
    n: 3,
    title: 'O relatório do cliente sai pronto',
    body: 'Com a sua marca, print por creator, totais, CPM e custo por engajamento. Link para compartilhar e PDF para anexar.',
  },
];

const reasons = [
  ['O creator não cria conta.', 'Zero atrito é o que faz ele responder. Link no celular, 90 segundos, pronto.'],
  ['A cobrança é do sistema, não sua.', 'Deixa de ser uma relação pessoal desconfortável e vira processo.'],
  ['A IA lê o print por você.', 'Alcance, impressões, salvos, compartilhamentos — preenchidos e editáveis.'],
  ['Nada depende de API do Instagram.', 'Não trava, não pede permissão e não some quando a Meta muda alguma coisa.'],
];

const plans = [
  { name: 'Grátis', price: 'R$ 0', note: '1 campanha · 5 creators', items: ['Link mágico por creator', 'Cobrança automática por e-mail', 'Relatório com marca PubliProva'], featured: false },
  { name: 'Solo', price: 'R$ 97', note: '3 campanhas · 30 creators/mês', items: ['Tudo do Grátis', 'Relatório sem marca PubliProva', 'Exportação CSV'], featured: false },
  { name: 'Agência', price: 'R$ 247', note: 'Campanhas ilimitadas · 150 creators/mês', items: ['Logo do seu cliente no relatório', '3 usuários', 'WhatsApp automático', 'Histórico de entrega por creator'], featured: true },
  { name: 'Studio', price: 'R$ 597', note: '500 creators/mês', items: ['Múltiplas marcas', 'Portal do cliente final', 'API e onboarding assistido'], featured: false },
];

const faq = [
  ['O creator precisa criar conta?', 'Não. Ele abre um link, envia e acabou. É justamente por isso que ele responde.'],
  ['E se o creator mandar um print errado ou editado?', 'O sistema guarda a imagem original, a data e hora do envio e valida o link do post. Divergências ficam sinalizadas no painel. Não é perícia — é registro e rastreabilidade, que é o que falta hoje.'],
  ['Funciona com Instagram, TikTok e YouTube?', 'Sim. Como a comprovação é print + link, funciona em qualquer plataforma, inclusive nas que não abrem API para terceiros.'],
  ['Preciso da senha ou do acesso do creator?', 'Nunca. Você não pede acesso a nada.'],
  ['E a LGPD?', 'Você é o controlador dos dados dos seus creators e o PubliProva é operador, com contrato de tratamento, exclusão sob demanda e retenção configurável por campanha.'],
];

export default function Landing() {
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="logo">Publi<span>Prova</span></Link>
          <div className="row">
            <Link href="/r/verao-hidrata-demo" className="btn btn-ghost btn-sm">Ver relatório de exemplo</Link>
            <Link href="/app" className="btn btn-sm">Começar grátis</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">Para agências e social medias que rodam campanhas com creators</span>
          <h1>Cadê o print?</h1>
          <p className="lead">
            Você não precisa mais cobrar link e print de 30 creators no WhatsApp. O PubliProva cobra
            sozinho e entrega o relatório do cliente pronto.
          </p>
          <div className="row" style={{ marginTop: 28 }}>
            <Link href="/app" className="btn">Começar grátis — 5 creators</Link>
            <Link href="/r/verao-hidrata-demo" className="btn btn-ghost">Ver um relatório de verdade →</Link>
          </div>
          <p className="small muted" style={{ marginTop: 14 }}>
            Sem cartão de crédito. Sua primeira campanha fecha hoje.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <h2>Toda campanha termina do mesmo jeito</h2>
          <ul className="list-clean" style={{ maxWidth: 640 }}>
            <li>Você manda mensagem para 30 creators pedindo o link do post.</li>
            <li>Metade responde. A outra metade você cobra de novo. E de novo.</li>
            <li>Você copia número por número dos prints pra uma planilha.</li>
            <li>Monta o PDF no Canva às 23h porque o cliente pede o relatório amanhã.</li>
          </ul>
          <p style={{ marginTop: 22, fontWeight: 600 }}>
            São 8 a 15 horas por mês fazendo o trabalho mais caro que existe: cobrar gente.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Três passos. O resto acontece sem você.</h2>
          <div className="grid grid-3" style={{ marginTop: 32 }}>
            {steps.map((s) => (
              <div className="card" key={s.n}>
                <span className="step-n">{s.n}</span>
                <h3 style={{ marginTop: 14 }}>{s.title}</h3>
                <p className="muted small" style={{ margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap">
          <h2>Por que funciona</h2>
          <div className="grid grid-3" style={{ marginTop: 28 }}>
            {reasons.map(([t, b]) => (
              <div key={t}>
                <h3>{t}</h3>
                <p className="muted small">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Menos que uma diária de estagiário.</h2>
          <p className="muted">Comece grátis. Suba de plano quando a primeira campanha fechar sozinha.</p>
          <div className="grid grid-4" style={{ marginTop: 28, alignItems: 'start' }}>
            {plans.map((p) => (
              <div className={`price-card${p.featured ? ' featured' : ''}`} key={p.name}>
                {p.featured && <span className="badge badge-brand" style={{ marginBottom: 10 }}>mais escolhido</span>}
                <h3>{p.name}</h3>
                <div className="price-value">{p.price}<span className="small muted" style={{ fontWeight: 500 }}>{p.price === 'R$ 0' ? '' : '/mês'}</span></div>
                <p className="tiny muted" style={{ margin: '6px 0 14px' }}>{p.note}</p>
                <ul className="list-clean tiny">
                  {p.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 18 }}>
            Anual com 2 meses grátis. Creator excedente R$ 2 — sem travar campanha em andamento.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap narrow">
          <h2>Perguntas frequentes</h2>
          <div className="stack" style={{ marginTop: 24 }}>
            {faq.map(([q, a]) => (
              <div className="card" key={q}>
                <h3>{q}</h3>
                <p className="muted small" style={{ margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section center">
        <div className="wrap">
          <h2>Sua próxima campanha pode fechar sozinha.</h2>
          <Link href="/app" className="btn" style={{ marginTop: 12 }}>Criar minha primeira campanha — grátis</Link>
        </div>
      </section>

      <footer className="wrap small muted" style={{ padding: '32px 20px 48px', borderTop: '1px solid var(--border)' }}>
        PubliProva · comprovação de campanhas com creators · feito para agências pequenas do Brasil
      </footer>
    </>
  );
}
