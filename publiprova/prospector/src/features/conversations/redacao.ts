import type { Business, Destino } from "../../lib/business.ts";
import { revisarSaida, type Revisao } from "./decisao.ts";

/**
 * A primeira resposta e escrita, nao gerada.
 *
 * Quem comentou RELATORIO pediu uma coisa so, e o post disse qual. Passar isso
 * por um modelo seria pagar token para introduzir variacao onde a variacao so
 * pode piorar — e abrir espaco para o modelo inventar. A IA entra depois, na
 * conversa, quando a pessoa responde algo que nao da para prever.
 */

export type Promessa = {
  palavra: string;
  destino: Destino;
};

/** Texto pronto para enviar, ja aprovado pelo filtro de afirmacoes. */
export type Redigido = { texto: string; entregouPromessa: boolean };

export function promessaDaPalavra(negocio: Business, palavra: string): Promessa | undefined {
  const config = negocio.palavrasChave.find((p) => p.palavra === palavra);
  return config ? { palavra: config.palavra, destino: config.destino } : undefined;
}

/**
 * Monta a resposta privada ao comentario. Cada ramo entrega exatamente o que o
 * post prometeu para aquela palavra.
 */
export function primeiraResposta(promessa: Promessa, negocio: Business): Redigido {
  const abertura = `Oi! Vi seu "${promessa.palavra}" no post.`;

  switch (promessa.destino.tipo) {
    case "demo":
      return {
        texto: [
          abertura,
          "",
          "Como prometi ali, aqui está o PubliProva por dentro. É o modo de demonstração: entra sem criar conta e sem senha.",
          promessa.destino.url,
          "",
          "Ainda está em construção e não abriu para o público. Se quiser, me diz depois o que fez sentido e o que não fez.",
        ].join("\n"),
        entregouPromessa: true,
      };

    case "conteudo_na_dm":
      return {
        texto: [
          abertura,
          "",
          promessa.destino.conteudo,
          "",
          "Pode copiar e adaptar do jeito que você fala com os seus creators.",
        ].join("\n"),
        entregouPromessa: true,
      };

    case "pesquisa":
      return {
        texto: [
          abertura,
          "",
          "Antes de abrir, estou ouvindo 15 agências numa pesquisa de 6 perguntas. Sem pitch, sem venda — quero entender como você cobra os creators hoje.",
          "",
          "Dá uns 10 minutos por aqui mesmo, no seu tempo. Posso começar?",
        ].join("\n"),
        entregouPromessa: true,
      };

    case "whatsapp":
      // Chega aqui so se alguem preencher `links.whatsapp` e apontar uma
      // palavra para la; `incoerencias()` barra a configuracao sem link.
      return {
        texto: [
          abertura,
          "",
          `Continuo por aqui ou no WhatsApp, como preferir: ${negocio.links.whatsapp}`,
        ].join("\n"),
        entregouPromessa: true,
      };
  }
}

/**
 * Redige e ja passa pelo portao. Devolve a revisao, nao o texto cru — quem
 * chama nao tem como esquecer de revisar, porque nao existe caminho que
 * devolva texto sem revisao.
 */
export function redigirPrimeiraResposta(promessa: Promessa, negocio: Business): Revisao {
  return revisarSaida(primeiraResposta(promessa, negocio).texto);
}
