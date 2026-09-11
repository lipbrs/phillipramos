import { notFound } from "next/navigation";

import { conversaDoLead } from "../../../src/features/painel/consultas.ts";
import { quandoFoi, rotuloCanal, rotuloEtapa, rotuloFunil } from "../../../src/lib/labels.ts";

export const dynamic = "force-dynamic";

export default async function Lead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dados = await conversaDoLead(Number(id));
  if (!dados) notFound();

  const { lead, conversa, pendencias } = dados;
  const abertas = pendencias.filter((p) => !p.resolvedAt);

  return (
    <main>
      <h2 style={{ marginTop: 0 }}>
        <a href="/">Painel</a> · @{lead.handle}
      </h2>

      <div className="cartoes">
        <div className="cartao">
          <div className="rotulo">Etapa</div>
          <div className="nota" style={{ marginTop: 6, fontSize: 15, color: "var(--texto)" }}>
            {rotuloEtapa(lead.stage)}
          </div>
          <div className="nota">{rotuloFunil(lead.funnel)}</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Canal</div>
          <div className="nota" style={{ marginTop: 6, fontSize: 15, color: "var(--texto)" }}>
            {rotuloCanal(lead.channelState)}
          </div>
          <div className="nota">
            {lead.messagingWindowExpiresAt
              ? `janela até ${new Date(lead.messagingWindowExpiresAt).toLocaleString("pt-BR")}`
              : "sem janela aberta"}
          </div>
        </div>
        <div className="cartao">
          <div className="rotulo">Veio de</div>
          <div className="nota" style={{ marginTop: 6, fontSize: 15, color: "var(--texto)" }}>
            {lead.originKeyword ?? lead.source}
          </div>
          <div className="nota">{quandoFoi(lead.createdAt)}</div>
        </div>
      </div>

      {lead.optOutAt && (
        <div className="faixa parado" style={{ marginTop: 20 }}>
          <div>
            <strong>Pediu para parar.</strong>{" "}
            <span className="detalhe">
              Permanente e entre campanhas — nada mais sai para este perfil, por nenhum canal.
            </span>
          </div>
        </div>
      )}

      {abertas.length > 0 && (
        <>
          <h2>Esperando você</h2>
          {abertas.map((p) => (
            <div className="vazio" key={p.id} style={{ marginBottom: 8 }}>
              <strong>{p.kind}</strong> · {quandoFoi(p.createdAt)}
              <div style={{ marginTop: 4 }}>{p.detail}</div>
            </div>
          ))}
        </>
      )}

      <h2>Conversa</h2>
      {conversa.length === 0 ? (
        <p className="vazio">Nada trocado ainda.</p>
      ) : (
        conversa.map((m) => (
          <div className={`balao ${m.direction === "outbound" ? "nossa" : ""}`} key={m.id}>
            <div className="quem">
              {m.direction === "outbound" ? "Nós" : `@${lead.handle}`} · {m.channel} ·{" "}
              {quandoFoi(m.sentAt)}
              {m.externalId?.startsWith("simulado:") ? " · SIMULADO" : ""}
            </div>
            {m.body}
          </div>
        ))
      )}
    </main>
  );
}
