import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

const schema = z.object({
  owner: z.object({ name: z.string().min(1), role: z.string().min(1) }),
  company: z.object({
    name: z.string().min(1),
    website: z.string().url(),
    instagramHandle: z.string().min(1),
    geography: z.string().min(1),
  }),
  links: z.object({ whatsapp: z.string().min(1), affiliateGroup: z.string().min(1) }),
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
});

export type Business = z.infer<typeof schema>;

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
  cached = parsed.data;
  return cached;
}

/** Placeholders que faltam preencher — o painel avisa em vez de envia-los. */
export function pendingPlaceholders(b: Business): string[] {
  const out: string[] = [];
  if (b.links.whatsapp.includes("{{")) out.push("links.whatsapp");
  if (b.links.affiliateGroup.includes("{{")) out.push("links.affiliateGroup");
  return out;
}

export function resetBusinessCache(): void {
  cached = null;
}
