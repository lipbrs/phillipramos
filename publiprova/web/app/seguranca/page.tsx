import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho, Rodape } from '../_site/cabecalho';
import { Revelar } from '../_site/revelar';

// Página de segurança. Regra: só entra o que existe no código hoje. O que
// ainda não existe fica na lista "o que ainda não temos", que é justamente o
// que dá credibilidade para o resto. Conferido contra web/lib e web/app antes
// de escrever: não há retenção automática nem exclusão self-service, então
// nenhuma das duas é prometida aqui.

export const metadata: Metadata = {
  title: 'Segurança e dados - PubliProva',
  description:
    'O que o PubliProva coleta, onde guarda, quem acessa e o que ainda não temos. Escrito para a agência que precisa responder ao jurídico do cliente.',
};

const coletamos = [
  ['Do creator', 'Nome, o contato que você cadastrou (e-mail ou telefone), o link do post publicado, o print dos insights que ele envia e os números lidos desse print.'],
  ['Da agência', 'E-mail de acesso, nome da agência, campanhas, prazos e cachês que você cadastra.'],
  ['Do uso', 'Data e hora de cada envio e de cada cobrança disparada, para que a comprovação tenha rastro.'],
];

const naoColetamos = [
  'Senha do creator. Em plataforma nenhuma.',
  'Acesso, token ou permissão de API da conta do creator.',
  'Mensagens privadas, lista de contatos ou qualquer coisa fora do que ele envia pelo link.',
  'Dado de pagamento. Não processamos cobrança de creator.',
];

const aindaNao = [
  ['Contrato de tratamento de dados', 'Está sendo escrito. Se o jurídico do seu cliente exigir antes de assinar, me avise que eu priorizo.'],
  ['Exclusão e retenção automáticas', 'Hoje a exclusão é feita por mim, a pedido, por e-mail, em até 5 dias úteis. Não existe ainda um botão no painel nem prazo de retenção configurável por campanha.'],
  ['Certificações (SOC 2, ISO 27001)', 'Não temos e não vamos fingir que temos. Somos um produto novo, operado por uma pessoa.'],
];

export default function Seguranca() {
  return (
    <>
      <Cabecalho atual="/seguranca" />

      <section className="hero">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Segurança e dados</span>
          <h1 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>
            O que a gente guarda, e o que não guarda
          </h1>
          <p className="lead" style={{ maxWidth: '58ch' }}>
            O creator é uma pessoa física, e os dados dele passam pela sua agência. Esta página
            existe para você conseguir responder ao jurídico do seu cliente sem precisar me
            perguntar.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap narrow revela">
          <h2>O que é coletado</h2>
          <div className="stack" style={{ marginTop: 22 }}>
            {coletamos.map(([t, b]) => (
              <div className="card" key={t}>
                <h3>{t}</h3>
                <p className="muted small" style={{ margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow revela">
          <h2>O que nunca é pedido</h2>
          <ul className="list-clean" style={{ marginTop: 18 }}>
            {naoColetamos.map((i) => <li key={i}>{i}</li>)}
          </ul>
          <p className="muted small" style={{ marginTop: 20 }}>
            É por isso que a comprovação é print mais link, e não integração com a conta do creator.
            A decisão custa um pouco de automação e economiza todo o resto.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap narrow revela">
          <h2>Quem é o quê, na LGPD</h2>
          <p className="muted">
            A sua agência é a <strong>controladora</strong> dos dados dos creators: é você quem
            decide coletar e para quê. O PubliProva é <strong>operador</strong>: trata os dados em
            seu nome, para a finalidade de comprovar a entrega da campanha, e não usa para mais
            nada. Nada é vendido, nada vira base de treinamento, nada é compartilhado com outra
            agência.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            O detalhamento está na{' '}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow revela">
          <h2>O que ainda não temos</h2>
          <p className="muted">
            Esta lista existe de propósito. Um fornecedor que só lista o que tem está escondendo
            alguma coisa.
          </p>
          <div className="stack" style={{ marginTop: 22 }}>
            {aindaNao.map(([t, b]) => (
              <div className="card" key={t}>
                <h3>{t}</h3>
                <p className="muted small" style={{ margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 24 }}>
            Faltou alguma coisa que o seu cliente vai perguntar?{' '}
            <a href="mailto:publiprova@gmail.com?subject=Pergunta%20sobre%20seguran%C3%A7a%20e%20dados">
              Me pergunte por e-mail
            </a>{' '}
            e eu respondo por escrito, para você poder encaminhar.
          </p>
        </div>
      </section>

      <Rodape />
      <Revelar />
    </>
  );
}
