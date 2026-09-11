import { z } from "zod";

/**
 * Fail fast and loudly: a missing token must stop the worker at boot, not at
 * the moment it is about to message a real person.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1).default("file:./data/prospector.db"),

  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5"),
  OPENAI_MODEL_FAST: z.string().min(1).default("gpt-5-mini"),
  OPENAI_MONTHLY_BUDGET_USD: z.coerce.number().positive().default(25),

  INSTAGRAM_APP_SECRET: z.string().min(1).optional(),
  INSTAGRAM_PAGE_ACCESS_TOKEN: z.string().min(1).optional(),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().min(1).optional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().min(1).optional(),

  /** Private replies to comments are capped per day for account health. */
  MAX_DMS_PER_DAY: z.coerce.number().int().positive().default(30),
  MIN_SECONDS_BETWEEN_DMS: z.coerce.number().int().positive().default(90),
  MAX_SECONDS_BETWEEN_DMS: z.coerce.number().int().positive().default(240),
  OPERATING_HOURS: z
    .string()
    .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "use HH:MM-HH:MM")
    .default("09:00-20:00"),
  OPERATING_TIMEZONE: z.string().min(1).default("America/Sao_Paulo"),

  /** Hard stop: nothing is ever sent while this is true. */
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

/** Which integrations are usable right now — the dashboard shows this. */
export function integrationStatus() {
  return {
    openai: Boolean(env.OPENAI_API_KEY),
    instagramApi: Boolean(env.INSTAGRAM_PAGE_ACCESS_TOKEN && env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
    instagramWebhook: Boolean(env.INSTAGRAM_APP_SECRET && env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN),
  };
}
