import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

/**
 * Destino de quem comenta a palavra-chave. E o que o post prometeu — nao o que
 * seria conveniente vender. Hoje nenhum destino e WhatsApp, porque nao temos
 * numero e nenhum post prometeu isso.
 */
const destino = z.discriminatedUnion("tipo", [
  /** Manda o link do modo de demonstracao do proprio site. */
  z.object({ tipo: z.literal("demo"), url: z.string().url() }),
  /** Entrega o conteudo prometido na propria DM, sem tirar a pessoa do lugar. */
  z.object({ tipo: z.literal("conteudo_na_dm"), conteudo: z.string().min(1) }),
  /** Convida para a pesquisa das 15 agencias, conduzida na propria conversa. */
  z.object({ tipo: z.literal("pesquisa") }),
  /** So fica valido quando `links.whatsapp` estiver preenchido. */
  z.object({ tipo: z.literal("whatsapp") }),
]);

const schema = z.object({
  owner: z.object({ name: z.string().min(1), role: z.string().min(1) }),
  company: z.object({
    name: z.string().min(1),
    website: z.string().url(),
    instagramHandle: z.string().min(1),
    geography: z.string().min(1),
  }),
  links: z.object({
    whatsapp: z.string(),
    affiliateGroup: z.string(),
    demo: z.string().url(),
  }),
  /** Funis que podem receber lead. O que nao esta aqui esta desligado. */
  funisAtivos: z.array(z.enum(["customer", "affiliate"])).min(1),
  pitch: z.object({
    oneLine: z.string().min(1),
    howItWorks: z.array(z.string().min(1)).min(1),
    revenueModel: z.string().min(1),
  }),
  marketJargon: z.record(z.string(), z.string()),
  verifiedClaims: z.array(z.string().min(1)).min(1),
  unverifiedClaims: z.array(z.string().min(1)),
  icp: z.object({
    segments: z.array(z.string().min(1)).min(1),
    keywords: z.array(z.string().min(1)).min(1),
  }),
  affiliateTopics: z.array(z.string().min(1)).min(1),
  /** Palavras que, comentadas num post nosso, viram lead. Sao dado de negocio. */
  palavrasChave: z
    .array(
      z.object({
        palavra: z.string().min(1),
        funil: z.enum(["customer", "affiliate"]),
        descricao: z.string().min(1),
        promessa: z.string().min(1),
        destino,
      }),
    )
    .min(1),
});

export type Business = z.infer<typeof schema>;
export type Destino = z.infer<typeof destino>;

let cached: Business | null = null;

export function loadBusiness(path = resolve(process.cwd(), "config/business.json")): Business {
  if (cached) return cached;
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new Error(
      `config/business.json nao encontrado em ${path}. Copie config/business.example.json e preencha.`,
    );
  }
  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`config/business.json invalido:\n${detail}`);
  }

  const negocio = parsed.data;
  const problemas = incoerencias(negocio);
  if (problemas.length > 0) {
    throw new Error(`config/business.json incoerente:\n  ${problemas.join("\n  ")}`);
  }

  cached = negocio;
  return cached;
}

/**
 * Coerencia que o schema sozinho nao pega: palavra apontando para funil
 * desligado, ou destino de WhatsApp sem numero configurado. Falhar no boot e
 * melhor do que descobrir na hora de responder um lead de verdade.
 */
export function incoerencias(b: Business): string[] {
  const out: string[] = [];
  for (const p of b.palavrasChave) {
    if (!b.funisAtivos.includes(p.funil)) {
      out.push(`palavra "${p.palavra}" aponta para o funil "${p.funil}", que esta desligado`);
    }
    if (p.destino.tipo === "whatsapp" && !b.links.whatsapp.trim()) {
      out.push(`palavra "${p.palavra}" manda para o WhatsApp, mas links.whatsapp esta vazio`);
    }
  }
  if (b.funisAtivos.includes("affiliate") && !b.links.affiliateGroup.trim()) {
    out.push("funil de afiliados ligado sem links.affiliateGroup preenchido");
  }
  return out;
}

export function funilEstaAtivo(b: Business, funil: "customer" | "affiliate"): boolean {
  return b.funisAtivos.includes(funil);
}

/** O que ainda falta para destravar recursos que hoje estao desligados. */
export function oQueFalta(b: Business): string[] {
  const out: string[] = [];
  if (!b.links.whatsapp.trim()) {
    out.push("links.whatsapp — sem ele, nenhuma palavra pode ter destino whatsapp");
  }
  if (!b.links.affiliateGroup.trim()) {
    out.push("links.affiliateGroup — sem ele, o funil de afiliados fica desligado");
  }
  return out;
}

export function resetBusinessCache(): void {
  cached = null;
}
