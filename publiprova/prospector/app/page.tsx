import {
  excecoesAbertas,
  funilPorEtapa,
  porPalavraChave,
  resumoDoPainel,
} from "../src/features/painel/consultas.ts";
import { quandoFoi, rotuloDestino, rotuloEtapa, rotuloCanal, rotuloJob } from "../src/lib/labels.ts";
import { pausarTudo, retomarTudo } from "./acoes.ts";

export const dynamic = "force-dynamic";

export default async function Painel() {
  const [resumo, colunas, palavras, pendencias] = await Promise.all([
    resumoDoPainel(),
    funilPorEtapa("customer"),
    porPalavraChave(),
    excecoesAbertas(5),
  ]);

  const totalLeads = colunas.reduce((s, c) => s + c.leads.length, 0);
  const naFila = (resumo.fila.pending ?? 0) + (resumo.fila.running ?? 0);

  return (
    <main>
      {resumo.pausa.pausado ? (
        <div className="faixa parado">
          <div>
            <strong>Parado.</strong>{" "}
            <span className="detalhe">
              {resumo.pausa.motivo} — {resumo.pausa.detalhe} · {quandoFoi(resumo.pausa.desde)}
            </span>
          </div>
          <form action={retomarTudo}>
            <button type="submit">Retomar</button>
          </form>
        </div>
      ) : (
        <div className="faixa rodando">
          <div>
            <strong>
              {resumo.modo === "simulacao" ? "Rodando em simulação" : "Rodando e enviando"}
            </strong>{" "}
            <span className="detalhe">
              {resumo.modo === "simulacao"
                ? "nada sai da máquina; cada mensagem fica gravada como sairia"
                : "mensagens estão saindo de verdade"}{" "}
              · janela {resumo.janela}
            </span>
          </div>
          <form action={pausarTudo}>
            <input type="hidden" name="motivo" value="pausado pelo painel" />
            <button type="submit" className="perigo">
              Parar tudo
            </button>
          </form>
        </div>
      )}

      <div className="cartoes">
        <div className="cartao">
          <div className="rotulo">Leads</div>
          <div className="valor">{totalLeads}</div>
          <div className="nota">no funil de clientes</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Enviados hoje</div>
          <div className="valor">
            {resumo.envios.hoje}
            <span style={{ fontSize: 15, color: "var(--fraco)" }}> / {resumo.envios.teto}</span>
          </div>
          <div className="nota">teto de saúde da conta</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Na fila</div>
          <div className="valor">{naFila}</div>
          <div className="nota">
            {Object.entries(resumo.fila)
              .map(([k, v]) => `${rotuloJob(k)}: ${v}`)
              .join(" · ") || "fila vazia"}
          </div>
        </div>
        <div className="cartao">
          <div className="rotulo">IA no mês</div>
          <div className="valor">US$ {resumo.orcamento.gastoUsd.toFixed(2)}</div>
          <div className="nota">
            de US$ {resumo.orcamento.tetoUsd.toFixed(2)}
            {/* Custo por lead so diz algo depois de existir gasto. */}
            {resumo.orcamento.gastoUsd > 0 && resumo.porResultado.usdPorLead !== null
              ? ` · US$ ${resumo.porResultado.usdPorLead.toFixed(3)} por lead`
              : ""}
          </div>
        </div>
        <div className="cartao">
          <div className="rotulo">Precisa de você</div>
          <div className="valor">{pendencias.length}</div>
          <div className="nota">
            <a href="/excecoes">ver a fila</a>
          </div>
        </div>
      </div>

      <h2>Funil de clientes</h2>
      {totalLeads === 0 ? (
        <p className="vazio">
          Nenhum lead ainda. Eles entram quando alguém comenta uma palavra-chave num post do
          @publiprova.app — o conteúdo é o motor, este sistema é a colheita.
        </p>
      ) : (
        <div className="kanban">
          {colunas.map((c) => (
            <div className="coluna" key={c.etapa}>
              <h3>
                <span>{rotuloEtapa(c.etapa)}</span>
                <span>{c.leads.length}</span>
              </h3>
              {c.leads.slice(0, 25).map((l) => (
                <a className="ficha" key={l.id} href={`/leads/${l.id}`}>
                  <div className="handle">@{l.handle}</div>
                  <div className="meta">
                    {l.originKeyword ? `${l.originKeyword} · ` : ""}
                    {rotuloCanal(l.channelState)}
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}

      <h2>Palavras-chave</h2>
      <table>
        <thead>
          <tr>
            <th>Palavra</th>
            <th>O post promete</th>
            <th>Destino</th>
            <th>Leads</th>
            <th>Respondidos</th>
          </tr>
        </thead>
        <tbody>
          {resumo.negocio.palavras.map((p) => {
            const contagem = palavras.find((x) => x.palavra === p.palavra);
            return (
              <tr key={p.palavra}>
                <td>
                  <strong>{p.palavra}</strong>
                </td>
                <td>{p.promessa}</td>
                <td>{rotuloDestino(p.destino)}</td>
                <td>{contagem?.total ?? 0}</td>
                <td>{contagem?.respondidos ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Configuração</h2>
      <div className="cartoes">
        <div className="cartao">
          <div className="rotulo">Integrações</div>
          <div className="nota" style={{ marginTop: 8, display: "grid", gap: 6 }}>
            <span className={`selo ${resumo.integracoes.instagramApi ? "sim" : "nao"}`}>
              API da Meta {resumo.integracoes.instagramApi ? "configurada" : "sem token"}
            </span>
            <span className={`selo ${resumo.integracoes.instagramWebhook ? "sim" : "nao"}`}>
              Webhook {resumo.integracoes.instagramWebhook ? "configurado" : "sem segredo"}
            </span>
            <span className={`selo ${resumo.integracoes.openai ? "sim" : "nao"}`}>
              OpenAI {resumo.integracoes.openai ? "configurada" : "sem chave"}
            </span>
          </div>
        </div>
        <div className="cartao">
          <div className="rotulo">Funis ligados</div>
          <div className="nota" style={{ marginTop: 8 }}>
            {resumo.negocio.funisAtivos.join(", ")}
          </div>
          {resumo.negocio.falta.length > 0 && (
            <div className="nota" style={{ marginTop: 10 }}>
              Desligado por falta de:
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {resumo.negocio.falta.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
