import Link from 'next/link';
import Image from 'next/image';
import { Cabecalho, Rodape } from './_site/cabecalho';
import { DemoFluxo } from './_site/demo';
import { Revelar } from './_site/revelar';

// Home. Regra desta página: toda seção que afirma alguma coisa mostra a tela
// que prova a afirmação. As capturas em /public são do produto rodando, não
// mockup: geradas pelo app local com os dados de demonstração.

const faq = [
  ['O creator precisa criar conta?', 'Não. Ele abre um link, envia e acabou. É justamente por isso que ele responde.'],
  ['E se o creator mandar um print errado ou editado?', 'O sistema guarda a imagem original, a data e hora do envio e valida o link do post. Divergências ficam sinalizadas no painel. Não é perícia. É registro e rastreabilidade, que é o que falta hoje.'],
  ['Funciona com Instagram, TikTok e YouTube?', 'Sim. Como a comprovação é print + link, funciona em qualquer plataforma, inclusive nas que não abrem API para terceiros.'],
  ['Preciso da senha ou do acesso do creator?', 'Nunca. Você não pede acesso a nada.'],
  ['Quanto tempo leva para montar a primeira campanha?', 'O tempo de colar a sua lista de creators. Os links saem na hora e a régua de cobrança começa no mesmo dia.'],
];

const planos = [
  { nome: 'Grátis', preco: 'R$ 0', nota: '1 campanha, 5 creators' },
  { nome: 'Solo', preco: 'R$ 97', nota: '3 campanhas, 30 creators/mês' },
  { nome: 'Agência', preco: 'R$ 247', nota: 'campanhas ilimitadas, 150 creators/mês' },
  { nome: 'Studio', preco: 'R$ 597', nota: '500 creators/mês' },
];

export default function Home() {
  return (
    <>
      <Cabecalho sobreCinema />

      <section className="hero cine">
        <div className="wrap hero-split">
          <div>
            <span className="eyebrow entra" style={{ ['--i' as string]: 0 }}>
              Para agências que rodam campanhas com creators
            </span>
            <h1 className="entra" style={{ ['--i' as string]: 1 }}>Cadê o print?</h1>
            <p className="lead entra" style={{ ['--i' as string]: 2 }}>
              Você não precisa mais cobrar link e print de 30 creators no WhatsApp. O PubliProva
              cobra sozinho e entrega o relatório do cliente pronto.
            </p>
            <div className="row entra" style={{ marginTop: 28, ['--i' as string]: 3 }}>
              <Link href="/app" className="btn">Começar grátis</Link>
              <Link href="/r/verao-hidrata-demo" className="btn btn-ghost">Ver relatório de exemplo</Link>
            </div>
          </div>
          <DemoFluxo />
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap revela">
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
        <div className="wrap duo revela">
          <div>
            <h2>A cobrança deixa de ser sua</h2>
            <p className="muted">
              Cada creator recebe um link pessoal. Sem cadastro, sem senha, sem aplicativo: ele cola
              o link do post, sobe o print dos insights e a IA transforma em números.
            </p>
            <p className="muted">
              Quem não entregou é cobrado por e-mail todo dia, em etapas relativas ao prazo. A régua
              para sozinha no instante em que o print chega, então ninguém cobra quem já entregou.
            </p>
            <Link href="/produto" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>
              Ver o fluxo completo
            </Link>
          </div>
          <div>
            <div className="moldura">
              <div className="barra"><i /><i /><i /></div>
              <Image
                src="/tela-campanha.jpg"
                alt="Campanha aberta no painel: creators em linhas com status comprovado em verde ou pendente em amarelo, alcance, engajamento e cachê, e a régua de cobrança automática no rodapé."
                width={1360}
                height={902}
                sizes="(max-width: 900px) 100vw, 620px"
              />
            </div>
            <p className="legenda">A campanha por dentro, com a régua de cobrança no rodapé.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap duo espelhado revela">
          <div>
            <h2>O relatório do cliente monta sozinho</h2>
            <p className="muted">
              Cada entrega que chega vira uma linha. No fim, o documento sai com a marca da agência:
              alcance, engajamento, CPM, custo por engajamento e o link de cada post publicado.
            </p>
            <p className="muted">
              O cliente abre por link, sem login. Você exporta em PDF ou CSV quando precisar anexar.
            </p>
            <Link href="/r/verao-hidrata-demo" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>
              Abrir um relatório de verdade
            </Link>
          </div>
          <div>
            <div className="moldura">
              <div className="barra"><i /><i /><i /></div>
              <Image
                src="/tela-relatorio.jpg"
                alt="Relatório de campanha do PubliProva: impressões, alcance, engajamento, CPM e custo por engajamento em destaque, e abaixo as entregas comprovadas de cada creator."
                width={1360}
                height={952}
                sizes="(max-width: 900px) 100vw, 620px"
              />
            </div>
            <p className="legenda">O relatório que o seu cliente recebe, com a sua marca.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap revela">
          <h2>Por que funciona</h2>
          <div className="duplas" style={{ marginTop: 32 }}>
            <div className="dupla">
              <h3>O creator não cria conta.</h3>
              <p className="muted small" style={{ margin: 0 }}>Zero atrito é o que faz ele responder. Link no celular, 90 segundos, pronto.</p>
            </div>
            <div className="dupla">
              <h3>A cobrança é do sistema, não sua.</h3>
              <p className="muted small" style={{ margin: 0 }}>Deixa de ser uma relação pessoal desconfortável e vira processo.</p>
            </div>
            <div className="dupla">
              <h3>A IA lê o print por você.</h3>
              <p className="muted small" style={{ margin: 0 }}>Alcance, impressões, salvos, compartilhamentos, todos preenchidos e editáveis.</p>
            </div>
            <div className="dupla">
              <h3>Nada depende de API do Instagram.</h3>
              <p className="muted small" style={{ margin: 0 }}>Não trava, não pede permissão e não some quando a Meta muda alguma coisa.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="precos" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap revela">
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
                {planos.map((pl) => (
                  <li key={pl.nome} className="spread" style={{ gap: 12 }}>
                    <span><strong>{pl.nome}</strong> <span className="muted">{pl.nota}</span></span>
                    <span className="num" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {pl.preco}{pl.preco === 'R$ 0' ? '' : '/mês'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="small muted" style={{ marginTop: 18, marginBottom: 0 }}>
                As primeiras agências entram com o preço travado enquanto forem clientes.{' '}
                <Link href="/sobre">Como isso funciona</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow revela">
          <h2>Perguntas frequentes</h2>
          <div className="stack" style={{ marginTop: 24 }}>
            {faq.map(([q, a]) => (
              <div className="card" key={q}>
                <h3>{q}</h3>
                <p className="muted small" style={{ margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 20 }}>
            Dúvida sobre dados e LGPD? Está tudo em <Link href="/seguranca">segurança</Link>.
          </p>
        </div>
      </section>

      <section className="section center" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap revela">
          <h2 style={{ margin: '0 auto .5em' }}>Sua próxima campanha pode fechar sozinha.</h2>
          <Link href="/app" className="btn" style={{ marginTop: 12 }}>Começar grátis</Link>
        </div>
      </section>

      <Rodape />
      <Revelar />
    </>
  );
}
