import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifica o cabecalho X-Hub-Signature-256 da Meta.
 *
 * A comparacao e em tempo constante de proposito: comparar com === vaza, pelo
 * tempo de resposta, quantos bytes iniciais o atacante acertou, e isso basta
 * para forjar a assinatura byte a byte.
 *
 * O corpo tem de ser o texto CRU recebido. Se for reserializado a partir de um
 * objeto, qualquer diferenca de espaco ou de ordem de chave muda o hash e a
 * assinatura legitima passa a ser recusada.
 */
export function assinaturaConfere(
  corpoCru: string,
  cabecalho: string | null,
  segredoDoApp: string,
): boolean {
  if (!cabecalho) return false;

  const [algoritmo, enviada] = cabecalho.split("=");
  if (algoritmo !== "sha256" || !enviada) return false;

  const esperada = createHmac("sha256", segredoDoApp).update(corpoCru, "utf8").digest("hex");

  const a = Buffer.from(esperada, "hex");
  const b = Buffer.from(enviada, "hex");
  // timingSafeEqual explode se os tamanhos diferem; checar antes nao vaza nada
  // util, porque o tamanho do hash e publico.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/**
 * Resposta ao handshake de verificacao (GET) que a Meta faz ao cadastrar a URL.
 * Devolve o challenge quando o token bate, e null quando nao bate.
 */
export function responderVerificacao(
  params: URLSearchParams,
  tokenEsperado: string,
): string | null {
  const modo = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (modo !== "subscribe" || !challenge) return null;
  if (!token || token !== tokenEsperado) return null;
  return challenge;
}
