import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — PubliProva',
  description:
    'Quais dados o PubliProva trata, por quê, com quem compartilha, por quanto tempo guarda e como pedir exclusão.',
};

/** Última revisão desta política. Atualize a data ao mexer no texto. */
const ATUALIZADA_EM = '11 de setembro de 2026';

export default function Privacidade() {
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="logo">
            Publi<span>Prova</span>
          </Link>
        </div>
      </header>

      <main className="wrap" style={{ padding: '48px 20px 64px', maxWidth: 760 }}>
        <h1>Política de Privacidade</h1>
        <p className="muted">Atualizada em {ATUALIZADA_EM}.</p>

        <p>
          O PubliProva é um serviço de coleta e comprovação de entregas de campanhas com
          creators, operado por Phillip Ramos. Esta política explica quais dados tratamos, por
          quê, com quem compartilhamos, por quanto tempo guardamos e como você pede exclusão.
          Ela cobre o site, o produto e o app <strong>publiprova</strong> registrado na Meta,
          que responde comentários no perfil <strong>@publiprova.app</strong> no Instagram.
        </p>

        <p>
          O PubliProva está em construção e ainda não abriu para o público. Esta política vale
          para o uso atual, inclusive no modo de demonstração.
        </p>

        <h2>1. Quem é responsável por quais dados</h2>
        <p>
          Quando uma agência usa o PubliProva para cobrar entregas dos seus creators, a
          <strong> agência é a controladora</strong> desses dados e o PubliProva atua como
          <strong> operador</strong>: tratamos os dados dos creators seguindo a instrução da
          agência, e não para finalidade própria.
        </p>
        <p>
          Quando você fala com a gente pelo Instagram, se cadastra no site ou responde à nossa
          pesquisa, o <strong>PubliProva é o controlador</strong> desses dados.
        </p>

        <h2>2. Dados do produto</h2>
        <ul>
          <li>
            <strong>Da agência:</strong> e-mail e senha de acesso, nome da agência, nome dos
            clientes e dados das campanhas que ela cadastra.
          </li>
          <li>
            <strong>Dos creators, cadastrados pela agência:</strong> nome, contato (e-mail e/ou
            telefone), entregáveis combinados e cachê.
          </li>
          <li>
            <strong>Do que o creator envia:</strong> o link do post e a imagem do print de
            insights, mais data e hora do envio. Guardamos a imagem original como registro de
            comprovação.
          </li>
          <li>
            <strong>Métricas extraídas do print:</strong> alcance, impressões, salvamentos,
            compartilhamentos e afins.
          </li>
        </ul>
        <p>
          <strong>O creator não cria conta e não informa senha.</strong> Ele abre um link
          pessoal, envia e pronto. Nunca pedimos acesso, login ou senha de conta de rede social
          — nem do creator, nem da agência.
        </p>

        <h2>3. Dados do Instagram (o app na Meta)</h2>
        <p>
          Nosso app usa a API oficial da Meta com as permissões
          <code> instagram_business_basic</code>, <code>instagram_business_manage_comments</code>{' '}
          e <code>instagram_business_manage_messages</code>, apenas na conta
          <strong> @publiprova.app</strong>, que é nossa. Com isso:
        </p>
        <ul>
          <li>
            <strong>Lemos comentários feitos nas nossas próprias publicações.</strong> Quando
            alguém comenta uma palavra-chave que o post pediu, guardamos o nome de usuário, o
            identificador da conta no Instagram, o texto do comentário e qual post gerou o
            contato.
          </li>
          <li>
            <strong>Respondemos por mensagem privada</strong>, pela API oficial, entregando o
            que aquele post prometeu. Guardamos o conteúdo da conversa.
          </li>
          <li>
            <strong>Não mandamos mensagem para quem nunca falou com a gente.</strong> A
            resposta privada só existe porque a pessoa comentou primeiro; a DM comum, só depois
            que ela escreveu.
          </li>
          <li>
            <strong>Não coletamos dados de contas que não interagiram com a gente</strong>, não
            raspamos perfis e não usamos API privada ou automação de navegador para contornar
            limite da plataforma.
          </li>
        </ul>
        <p>
          Esses dados servem para responder a pessoa e para saber qual conteúdo traz conversa.
          Não são vendidos, não alimentam publicidade de terceiros e não são cruzados com
          bases externas.
        </p>

        <h2>4. Pedido de parar</h2>
        <p>
          Se você pedir para parar — por qualquer palavra, em qualquer conversa — o pedido é
          atendido na hora e <strong>é permanente</strong>: seu perfil entra numa lista de não
          contatar e não recebe mais nada, por nenhum canal e por nenhuma campanha futura.
          Guardamos apenas o mínimo necessário para cumprir esse pedido, que é o identificador
          do perfil e a data.
        </p>

        <h2>5. Base legal (LGPD)</h2>
        <ul>
          <li>
            <strong>Execução de contrato</strong> (art. 7º, V) — dados da agência e das
            campanhas, necessários para o serviço funcionar.
          </li>
          <li>
            <strong>Legítimo interesse</strong> (art. 7º, IX) — responder quem nos procurou por
            comentário ou mensagem, e medir qual conteúdo gera contato.
          </li>
          <li>
            <strong>Consentimento</strong> (art. 7º, I) — participação na nossa pesquisa e
            recebimento de novidades, sempre reversível.
          </li>
        </ul>
        <p>
          Quando somos operador, a base legal do tratamento dos dados dos creators é
          responsabilidade da agência controladora.
        </p>

        <h2>6. Com quem compartilhamos</h2>
        <p>Só com quem é necessário para o serviço rodar:</p>
        <ul>
          <li>
            <strong>Meta Platforms</strong> — para enviar e receber as mensagens do Instagram.
          </li>
          <li>
            <strong>OpenAI</strong> — para ler o print de insights e transformar em números, e
            para redigir parte das mensagens. O conteúdo enviado é o necessário para essa
            tarefa.
          </li>
          <li>
            <strong>Vercel</strong> (hospedagem) e <strong>Supabase</strong> (banco de dados).
          </li>
        </ul>
        <p>
          Esses serviços podem tratar dados fora do Brasil. Não vendemos dados pessoais nem os
          compartilhamos para publicidade de terceiros.
        </p>

        <h2>7. Por quanto tempo guardamos</h2>
        <ul>
          <li>
            <strong>Dados de campanha e prints:</strong> enquanto a conta da agência existir, ou
            pelo prazo que ela configurar. A agência pode pedir exclusão a qualquer momento.
          </li>
          <li>
            <strong>Conversas do Instagram:</strong> até 24 meses, e antes disso se você pedir.
          </li>
          <li>
            <strong>Lista de não contatar:</strong> indefinidamente — é o que garante que o
            pedido de parar seja respeitado.
          </li>
        </ul>

        <h2>8. Seus direitos</h2>
        <p>
          Você pode pedir confirmação de tratamento, acesso, correção, anonimização, portabilidade
          e exclusão dos seus dados, além de revogar consentimento (LGPD, art. 18). Se o dado
          estiver sob controle de uma agência cliente, encaminhamos o pedido a ela e ajudamos no
          cumprimento.
        </p>

        <h2>9. Segurança</h2>
        <p>
          Acesso por senha com sessão própria por agência, dados isolados por conta, tráfego em
          HTTPS e segredos fora do código. Nenhum sistema é imune: se acontecer incidente com
          risco relevante, comunicamos os titulares e a ANPD.
        </p>

        <h2>10. Menores de idade</h2>
        <p>
          O serviço é para uso profissional e não se destina a menores de 18 anos. Não coletamos
          dados de crianças e adolescentes de forma intencional.
        </p>

        <h2>11. Contato</h2>
        <p>
          Para qualquer pedido sobre dados pessoais, fale com a gente pela mensagem direta do{' '}
          <a href="https://www.instagram.com/publiprova.app/" rel="noopener noreferrer">
            @publiprova.app
          </a>{' '}
          no Instagram. Respondemos em até 15 dias.
        </p>

        <h2>12. Mudanças</h2>
        <p>
          Se esta política mudar, a data no topo muda com ela. Alteração relevante é avisada aos
          clientes ativos.
        </p>

        <p className="muted" style={{ marginTop: 40 }}>
          <Link href="/">Voltar para a página inicial</Link>
        </p>
      </main>
    </>
  );
}
