import type { ChannelState, Funnel } from "../db/schema.ts";
import type { Stage } from "../features/leads/transitions.ts";

/**
 * Os valores internos ficam em ingles (ADR-004) porque trocar nome de coluna
 * depois do banco existir e retrabalho sem ganho. Quem le o painel, nao.
 */

const ETAPAS: Record<string, string> = {
  discovered: "Descoberto",
  qualified: "Qualificado",
  contacted: "Respondido",
  replied: "Respondeu",
  interested: "Interessado",
  whatsapp_handoff: "Encaminhado",
  registered: "Cadastrado",
  active_customer: "Cliente ativo",
  joined_affiliate_group: "Entrou no grupo",
  active_affiliate: "Afiliado ativo",
  generated_customer: "Trouxe cliente",
  closed: "Encerrado",
};

const CANAIS: Record<ChannelState, string> = {
  inbound_pending: "Comentou, aguarda resposta",
  private_reply_sent: "Respondemos no privado",
  waiting_inbound_reply: "Esperando a pessoa",
  api_eligible: "Pode receber DM",
  api_active: "Conversa aberta",
  api_window_closed: "Janela fechada",
  human_review_required: "Precisa de você",
  do_not_contact: "Pediu para parar",
  blocked: "Bloqueado",
  completed: "Concluído",
};

const FUNIS: Record<Funnel, string> = {
  customer: "Clientes",
  affiliate: "Afiliados",
};

const DESTINOS: Record<string, string> = {
  demo: "Modo demonstração",
  conteudo_na_dm: "Conteúdo na DM",
  pesquisa: "Convite da pesquisa",
  whatsapp: "WhatsApp",
};

const JOBS: Record<string, string> = {
  pending: "Na fila",
  running: "Rodando",
  done: "Feita",
  failed: "Falhou",
  dead: "Desistiu",
};

export const rotuloEtapa = (v: Stage | string) => ETAPAS[v] ?? v;
export const rotuloCanal = (v: ChannelState | string) => CANAIS[v as ChannelState] ?? v;
export const rotuloFunil = (v: Funnel | string) => FUNIS[v as Funnel] ?? v;
export const rotuloDestino = (v: string) => DESTINOS[v] ?? v;
export const rotuloJob = (v: string) => JOBS[v] ?? v;

/** "há 3 minutos", "ontem" — data absoluta em tabela mente sobre o que é recente. */
export function quandoFoi(iso: string | null | undefined, agora = new Date()): string {
  if (!iso) return "—";
  const minutos = Math.round((agora.getTime() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
