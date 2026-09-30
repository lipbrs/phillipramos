import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Cabecalho, Rodape } from '../_site/cabecalho';

// /produto — o fluxo completo, com a tela de cada etapa. Existe para tirar da
// home a explicação longa e para dar à agência uma página que ela consegue
// encaminhar internamente.

export const metadata: Metadata = {
  title: 'Como funciona - PubliProva',
  description:
    'O fluxo completo: da lista de creators ao relatório do cliente, com as telas reais de cada etapa.',
};

export default function Produto() {
  return (
    <>
      <Cabecalho atual="/produto" />

      <section className="hero">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Como funciona</span>
          <h1 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>
            Da lista de creators ao relatório do cliente
          </h1>
          <p className="lead" style={{ maxWidth: '58ch' }}>
            Três etapas. Você só participa da primeira. As telas abaixo são do produto rodando,
            com a campanha de demonstração.
          </p>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="wrap duo revela">
          <div>
            <span className="step-n">1</span>
            <h2 style={{ marginTop: 14 }}>Você cola a lista e some</h2>
            <p className="muted">
              Nome, contato, entregáveis e cachê, direto da planilha que você já usa. Define o prazo
              de postagem e o prazo de comprovação. A campanha nasce com o placar zerado e cada
              creator já com o seu link pessoal.
            </p>
            <p className="muted" style={{ marginBottom: 0 }}>
              É a única etapa que consome tempo seu, e ela dura o tempo de um Ctrl+V.
            </p>
          </div>
          <div>
            <div className="moldura">
              <div className="barra"><i /><i /><i /></div>
              <Image
                src="/tela-painel.jpg"
                alt="Lista de campanhas do PubliProva com cliente, prazo e quantas entregas foram comprovadas em cada uma."
                width={1360}
                height={1150}
                priority
                sizes="(max-width: 900px) 100vw, 620px"
              />
            </div>
            <p className="legenda">A lista de campanhas, com o placar de cada uma.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap duo espelhado revela">
          <div>
            <span className="step-n">2</span>
            <h2 style={{ marginTop: 14 }}>O sistema cobra, não você</h2>
            <p className="muted">
              O creator abre o link no celular, cola o endereço do post e sobe o print dos insights.
              A IA lê alcance, impressões, salvos e compartilhamentos, e ele só confere. Sem
              cadastro, sem senha, sem baixar nada.
            </p>
            <p className="muted">
              Quem não entregou recebe cobrança por e-mail uma vez por dia, em etapas relativas ao
              prazo: D-2, D0, D+1, D+3 e D+7. A régua para no instante em que o print chega.
            </p>
            <p className="muted" style={{ marginBottom: 0 }}>
              No painel, verde é comprovado e amarelo é pendente. O botão de WhatsApp aparece só em
              quem está atrasado, para quando você quiser cobrar na mão mesmo assim.
            </p>
          </div>
          <div>
            <div className="moldura">
              <div className="barra"><i /><i /><i /></div>
              <Image
                src="/tela-campanha.jpg"
                alt="Campanha aberta: creators em linhas com status comprovado ou pendente, alcance, engajamento, cachê e a régua de cobrança automática em D-2, D0, D+1, D+3 e D+7."
                width={1360}
                height={902}
                sizes="(max-width: 900px) 100vw, 620px"
              />
            </div>
            <p className="legenda">A campanha por dentro, com a régua de cobrança no rodapé.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="wrap duo revela">
          <div>
            <span className="step-n">3</span>
            <h2 style={{ marginTop: 14 }}>O relatório já existe quando o cliente pede</h2>
            <p className="muted">
              Ele não é montado no fim: cada entrega que chega já vira uma linha. Quando o cliente
              pergunta, o documento está pronto, com a marca da agência, os totais, o CPM, o custo
              por engajamento e o link de cada post publicado.
            </p>
            <p className="muted" style={{ marginBottom: 0 }}>
              O cliente abre por link, sem login. Você exporta em PDF para anexar ou em CSV para
              jogar na planilha de fechamento.
            </p>
          </div>
          <div>
            <div className="moldura">
              <div className="barra"><i /><i /><i /></div>
              <Image
                src="/tela-relatorio.jpg"
                alt="Relatório de campanha com impressões, alcance, engajamento, CPM e custo por engajamento em destaque, e as entregas comprovadas de cada creator abaixo."
                width={1360}
                height={952}
                sizes="(max-width: 900px) 100vw, 620px"
              />
            </div>
            <p className="legenda">O relatório do cliente, aberto por link.</p>
          </div>
        </div>
      </section>

      <section className="section center" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap revela">
          <h2 style={{ margin: '0 auto .5em' }}>Veja um relatório antes de criar conta</h2>
          <p className="muted" style={{ maxWidth: '46ch', margin: '0 auto' }}>
            O relatório de demonstração está aberto. É o mesmo que o seu cliente receberia.
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Link href="/r/verao-hidrata-demo" className="btn btn-ghost">Ver relatório de exemplo</Link>
            <Link href="/app" className="btn">Começar grátis</Link>
          </div>
        </div>
      </section>

      <Rodape />
    </>
  );
}
