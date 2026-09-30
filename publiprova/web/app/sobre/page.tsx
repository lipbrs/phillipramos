import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho, Rodape } from '../_site/cabecalho';

// /sobre — para onde foi a história de "construído em público". Na home ela
// lia como aviso de risco; aqui ela é o argumento: acesso direto a quem
// constrói e preço travado. O fato continua no site, sem virar vitrine.

export const metadata: Metadata = {
  title: 'Quem faz o PubliProva',
  description:
    'Quem está por trás, por que o produto existe e o que significa entrar como uma das primeiras agências.',
};

export default function Sobre() {
  return (
    <>
      <Cabecalho atual="/sobre" />

      <section className="hero">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <span className="eyebrow">Quem faz</span>
          <h1 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>
            Um produto, uma pessoa, nenhuma promessa vaga
          </h1>
          <p className="lead" style={{ maxWidth: '56ch' }}>
            O PubliProva é feito por Phillip Ramos. Não é uma startup com time e rodada: é um
            produto sendo construído em público, com quem usa perto de quem escreve o código.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap narrow revela">
          <h2>Por que ele existe</h2>
          <p className="muted">
            Antes de escrever uma linha, a pergunta foi feita a agências de marketing de influência:
            o que dói no fim da campanha? A resposta se repetiu. Não é achar creator, não é negociar
            cachê, não é aprovar roteiro. É a semana depois do post, cobrando link e print de gente
            que já foi paga, para montar um relatório que o cliente vai olhar por dois minutos.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            O PubliProva resolve só isso. É de propósito: uma ferramenta que faz uma coisa bem vale
            mais que uma plataforma que faz dez pela metade.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow revela">
          <h2>O que significa entrar agora</h2>
          <p className="muted">
            O produto está em construção aberta e as primeiras agências entram em condição
            diferente. Não é desconto de lançamento: é troca.
          </p>
          <ul className="list-clean" style={{ marginTop: 18 }}>
            <li><strong>Preço travado.</strong> O valor de entrada continua o mesmo enquanto você for cliente, mesmo quando a tabela subir.</li>
            <li><strong>Acesso direto a quem constrói.</strong> Você fala comigo, não com suporte. O que trava a sua operação entra na fila na frente.</li>
            <li><strong>Peso na direção do produto.</strong> Boa parte do que existe hoje veio de conversa com agência, não de roadmap.</li>
          </ul>
          <p className="muted small" style={{ marginTop: 20 }}>
            Em troca, eu peço retorno honesto quando alguma coisa não funcionar, e permissão para
            citar a agência como cliente quando funcionar.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap narrow revela">
          <h2>Construído em público</h2>
          <p className="muted">
            Cada semana o que funcionou e o que não funcionou vai para o Instagram do produto,
            incluindo os números feios. Se você quiser acompanhar antes de decidir, é por lá.
          </p>
          <div className="row" style={{ marginTop: 22 }}>
            <a
              className="btn btn-ghost"
              href="https://www.instagram.com/publiprova.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Acompanhar no Instagram
            </a>
            <a
              className="btn"
              href="mailto:publiprova@gmail.com?subject=Quero%20entrar%20como%20uma%20das%20primeiras%20ag%C3%AAncias"
            >
              Falar comigo por e-mail
            </a>
          </div>
        </div>
      </section>

      <section className="section center">
        <div className="wrap revela">
          <h2 style={{ margin: '0 auto .5em' }}>Ou simplesmente teste</h2>
          <p className="muted" style={{ maxWidth: '44ch', margin: '0 auto' }}>
            A conta grátis abre uma campanha com cinco creators. Não precisa cartão e não precisa
            falar comigo.
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Link href="/app" className="btn">Começar grátis</Link>
          </div>
        </div>
      </section>

      <Rodape />
    </>
  );
}
