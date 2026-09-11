import { excecoesAbertas } from "../../src/features/painel/consultas.ts";
import { quandoFoi } from "../../src/lib/labels.ts";
import { resolverExcecao } from "../acoes.ts";

export const dynamic = "force-dynamic";

const EXPLICACAO: Record<string, string> = {
  precisa_de_humano: "O sistema parou de propósito e deixou para você.",
  envio_recusado: "A Meta recusou o envio e não adianta repetir.",
};

export default async function Excecoes() {
  const abertas = await excecoesAbertas(200);

  return (
    <main>
      <h2>Precisa de você</h2>
      <p style={{ color: "var(--fraco)", fontSize: 14, marginTop: -4 }}>
        Tudo que o sistema preferiu não decidir sozinho. Responder é no Instagram; aqui você só
        marca o que já tratou.
      </p>

      {abertas.length === 0 ? (
        <p className="vazio">Nada pendente.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Quando</th>
              <th>Quem</th>
              <th>O quê</th>
              <th>Detalhe</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {abertas.map((e) => (
              <tr key={e.id}>
                <td style={{ whiteSpace: "nowrap", color: "var(--fraco)" }}>
                  {quandoFoi(e.createdAt)}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {e.leadId ? <a href={`/leads/${e.leadId}`}>@{e.handle}</a> : "—"}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {EXPLICACAO[e.kind] ? (
                    <span title={EXPLICACAO[e.kind]}>{e.kind}</span>
                  ) : (
                    e.kind
                  )}
                </td>
                <td>{e.detail}</td>
                <td>
                  <form action={resolverExcecao}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit">Já tratei</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
