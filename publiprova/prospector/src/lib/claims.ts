/**
 * O portao das afirmacoes.
 *
 * A IA so pode afirmar o que esta em `verifiedClaims`. Isso nao da para checar
 * semanticamente com confianca, entao este e um filtro de negacao sobre os
 * formatos que uma afirmacao falsa assume — numero, preco, garantia,
 * superlativo, relacao. O que ele pega e bloqueado e vai para revisao humana,
 * nunca suavizado: afirmacao nao comprovada parafraseada continua nao comprovada.
 */

export type Violation = { rule: string; match: string; detail: string };

export type ClaimCheck =
  | { ok: true }
  | { ok: false; violations: Violation[] };

type Rule = { name: string; pattern: RegExp; detail: string };

const RULES: Rule[] = [
  {
    name: "price",
    pattern: /\bR\$\s?\d|\b\d+\s?(reais|conto)\b|\bmensalidade\b|\bpre[çc]o\b|\bplano\s+(agência|agencia|starter|pro)\b/gi,
    detail: "Preço não está publicado no site — bloqueado até estar.",
  },
  {
    name: "metric",
    pattern: /\b\d+(?:[.,]\d+)?\s?%|\b\d+\s*(?:a|até|-)\s*\d+\s*(?:horas?|h)\b|\b\d+\s*horas?\s*(?:por|\/)\s*m[êe]s\b/gi,
    detail: "Número/estatística: só a estimativa do estudo, e sempre com a palavra 'estimativa'.",
  },
  {
    name: "customer_count",
    pattern: /\b\d+\s*(clientes?|ag[êe]ncias?\s+usam|usu[áa]rios?|campanhas?\s+rodadas?)\b|\bj[áa]\s+(temos|somos)\b/gi,
    detail: "Contagem de clientes/usuários — hoje é zero.",
  },
  {
    name: "guarantee",
    pattern: /\bgarant(o|imos|ido|ia)\b|\bcom certeza (voc[êe]|vai)\b|\bvai (aumentar|dobrar|triplicar|render)\b|\bresultado garantido\b|\bsem risco\b/gi,
    detail: "Promessa de resultado ou garantia.",
  },
  {
    name: "superlative",
    pattern: /\bo\s+(único|unico|melhor|primeiro|maior)\b|\ba\s+(única|unica|melhor|primeira|maior)\b|\bninguém\s+mais\b|\blíder\s+de\s+mercado\b/gi,
    detail: "Superlativo ou exclusividade.",
  },
  {
    name: "relationship",
    pattern: /\bparceir[oa]\s+oficial\b|\bs[óo]ci[oa]\s+d[ao]\b|\bcertificad[oa]\s+pel[ao]\b|\bautorizad[oa]\s+pel[ao]\s+(meta|instagram)\b/gi,
    detail: "Relação societária, parceria ou certificação não comprovada.",
  },
  {
    name: "account_promise",
    pattern: /\baprova[çc][ãa]o\s+(da\s+)?(sua\s+)?conta\b|\bconta\s+aprovada\b|\bsem\s+(kyc|an[áa]lise)\b/gi,
    detail: "Promessa de aprovação de conta ou de pular cadastro/KYC.",
  },
  {
    name: "launch_date",
    pattern: /\b(abre|lan[çc]a|dispon[íi]vel)\s+(em|dia|no dia)\s+\d|\bat[ée]\s+(o\s+)?(fim\s+d[eo]\s+)?(m[êe]s|ano|semana)\b/gi,
    detail: "Data de abertura não definida.",
  },
];

export function checkClaims(text: string): ClaimCheck {
  const violations: Violation[] = [];
  for (const rule of RULES) {
    // Zera o lastIndex a cada chamada: sao regex /g reaproveitadas entre chamadas.
    rule.pattern.lastIndex = 0;
    const found = text.match(rule.pattern);
    if (found) {
      for (const match of new Set(found)) {
        violations.push({ rule: rule.name, match: match.trim(), detail: rule.detail });
      }
    }
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}

/** Motivo legivel para a fila de excecoes. */
export function describeViolations(violations: Violation[]): string {
  return violations
    .map((v) => `[${v.rule}] "${v.match}" — ${v.detail}`)
    .join(" | ");
}
