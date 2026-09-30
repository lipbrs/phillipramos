import Link from 'next/link';
import Image from 'next/image';

const steps = [
  {
    n: 1,
    title: 'Cole sua lista de creators',
    body: 'Nome, contato, entregáveis e cachê, direto da sua planilha. Trinta segundos.',
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
  ['A IA lê o print por você.', 'Alcance, impressões, salvos, compartilhamentos, todos preenchidos e editáveis.'],
  ['Nada depende de API do Instagram.', 'Não trava, não pede permissão e não some quando a Meta muda alguma coisa.'],
];

const plans = [
  { name: 'Grátis', price: 'R$ 0', note: '1 campanha, 5 creators' },
  { name: 'Solo', price: 'R$ 97', note: '3 campanhas, 30 creators/mês' },
  { name: 'Agência', price: 'R$ 247', note: 'campanhas ilimitadas, 150 creators/mês' },
  { name: 'Studio', price: 'R$ 597', note: '500 creators/mês' },
];

const faq = [
  ['O creator precisa criar conta?', 'Não. Ele abre um link, envia e acabou. É justamente por isso que ele responde.'],
  ['E se o creator mandar um print errado ou editado?', 'O sistema guarda a imagem original, a data e hora do envio e valida o link do post. Divergências ficam sinalizadas no painel. Não é perícia. É registro e rastreabilidade, que é o que falta hoje.'],
  ['Funciona com Instagram, TikTok e YouTube?', 'Sim. Como a comprovação é print + link, funciona em qualquer plataforma, inclusive nas que não abrem API para terceiros.'],
  ['Preciso da senha ou do acesso do creator?', 'Nunca. Você não pede acesso a nada.'],
  ['E a LGPD?', 'Você é o controlador dos dados dos seus creators e o PubliProva é o operador. Já existem exclusão sob demanda, retenção configurável por campanha e política de privacidade publicada. O contrato de tratamento ainda está sendo escrito. Se for condição para a sua agência assinar, me diga que eu priorizo.'],
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
        <div className="wrap hero-split">
          <div>
            <span className="eyebrow">Para agências que rodam campanhas com creators</span>
            <h1>Cadê o print?</h1>
            <p className="lead">
              Você não precisa mais cobrar link e print de 30 creators no WhatsApp. O PubliProva
              cobra sozinho e entrega o relatório do cliente pronto.
            </p>
            <div className="row" style={{ marginTop: 28 }}>
              <Link href="/app" className="btn">Começar grátis</Link>
              <Link href="/r/verao-hidrata-demo" className="btn btn-ghost">Ver relatório de exemplo</Link>
            </div>
          </div>
          <div>
            <div className="moldura">
              <div className="barra"><i /><i /><i /></div>
              <Image
                src="/painel.jpg"
                alt="Painel do PubliProva com uma campanha aberta: cada creator numa linha, quem entregou em verde e quem está sendo cobrado em amarelo."
                width={1200}
                height={760}
                priority
              />
            </div>
            <p className="legenda">O painel de hoje, com dados de demonstração. Quem entregou fica verde sozinho.</p>
          </div>
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
          <div className="duplas" style={{ marginTop: 32 }}>
            {reasons.map(([t, b]) => (
              <div className="dupla" key={t}>
                <h3>{t}</h3>
                <p className="muted small" style={{ margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Quanto custa</h2>
          <div className="preco-linha" style={{ marginTop: 28 }}>
            <div>
              <div className="preco-grande">R$ 97</div>
              <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>por mês, plano Solo</p>
            </div>
            <div>
              <p style={{ marginTop: 0 }}>
                Começa em zero e sobe conforme a operação cresce. Creator excedente custa R$ 2 e não
                trava campanha em andamento. No anual, dois meses saem de graça.
              </p>
              <ul className="list-clean small" style={{ marginTop: 4 }}>
                {plans.map((pl) => (
                  <li key={pl.name} className="spread" style={{ gap: 12 }}>
                    <span><strong>{pl.name}</strong> <span className="muted">{pl.note}</span></span>
                    <span className="num" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {pl.price}{pl.price === 'R$ 0' ? '' : '/mês'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="small muted" style={{ marginTop: 18, marginBottom: 0 }}>
                Sendo honesto sobre o estágio: o PubliProva está sendo construído em público e ainda
                não tem cliente pagante. Esses são os preços planejados. Se a sua agência quiser ser
                uma das primeiras, o preço de entrada fica travado enquanto você for cliente.
              </p>
            </div>
          </div>
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
          <Link href="/app" className="btn" style={{ marginTop: 12 }}>Começar grátis</Link>
        </div>
      </section>

      <footer className="wrap small muted" style={{ padding: '32px 20px 48px', borderTop: '1px solid var(--border)' }}>
        PubliProva · comprovação de campanhas com creators · feito para agências pequenas do Brasil
        {' · '}
        <Link href="/privacidade">Política de Privacidade</Link>
      </footer>
    </>
  );
}
