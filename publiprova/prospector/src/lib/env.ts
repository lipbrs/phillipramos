import { z } from "zod";

/**
 * Falhar cedo e alto: token faltando tem de parar o worker no boot, e nao na
 * hora em que ele ja ia mandar mensagem para uma pessoa de verdade.
 */
/**
 * Campo opcional que aceita vir vazio.
 *
 * O `.env.example` traz esses campos em branco de proposito — o operador copia
 * o arquivo e roda em simulacao antes de ter qualquer token. Sem isto, string
 * vazia nao e "ausente" para o zod e o sistema nao sobe nem para simular.
 */
const opcional = () =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1).default("file:./data/prospector.db"),

  OPENAI_API_KEY: opcional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5"),
  OPENAI_MODEL_FAST: z.string().min(1).default("gpt-5-mini"),
  OPENAI_MONTHLY_BUDGET_USD: z.coerce.number().positive().default(25),

  INSTAGRAM_APP_SECRET: opcional(),
  INSTAGRAM_PAGE_ACCESS_TOKEN: opcional(),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: opcional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: opcional(),
  /** Data (AAAA-MM-DD) em que o token vence. Escrita pelo `pnpm doutor`. */
  INSTAGRAM_TOKEN_VENCE_EM: opcional(),

  /** Teto diario de respostas privadas a comentario, por saude da conta. */
  MAX_DMS_PER_DAY: z.coerce.number().int().positive().default(30),
  MIN_SECONDS_BETWEEN_DMS: z.coerce.number().int().positive().default(90),
  MAX_SECONDS_BETWEEN_DMS: z.coerce.number().int().positive().default(240),
  OPERATING_HOURS: z
    .string()
    .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "use HH:MM-HH:MM")
    .default("09:00-20:00"),
  OPERATING_TIMEZONE: z.string().min(1).default("America/Sao_Paulo"),

  /** Trava dura: nada e enviado de verdade enquanto isto for true. */
  DRY_RUN: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${detail}`);
  }
  if (parsed.data.MIN_SECONDS_BETWEEN_DMS > parsed.data.MAX_SECONDS_BETWEEN_DMS) {
    throw new Error("MIN_SECONDS_BETWEEN_DMS must be <= MAX_SECONDS_BETWEEN_DMS");
  }
  return parsed.data;
}

export const env: Env = load();

/**
 * Dias que faltam para o token da Meta vencer, ou null se nao sabemos.
 *
 * O token de longa duracao dura 60 dias. Sem este aviso, o sintoma no dia 61 e
 * todo envio falhando com 400 — erro que parece bug de codigo e nao e.
 */
export function diasAteOTokenVencer(agora: Date = new Date()): number | null {
  if (!env.INSTAGRAM_TOKEN_VENCE_EM) return null;
  const vence = new Date(`${env.INSTAGRAM_TOKEN_VENCE_EM}T00:00:00Z`);
  if (Number.isNaN(vence.getTime())) return null;
  return Math.floor((vence.getTime() - agora.getTime()) / 86_400_000);
}

/** Quais integracoes da para usar agora — o painel mostra isto. */
export function integrationStatus() {
  return {
    openai: Boolean(env.OPENAI_API_KEY),
    instagramApi: Boolean(env.INSTAGRAM_PAGE_ACCESS_TOKEN && env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
    instagramWebhook: Boolean(env.INSTAGRAM_APP_SECRET && env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN),
  };
}
