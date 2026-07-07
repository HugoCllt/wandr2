import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_TOKEN: z.string().min(1),
  // Agent API (/api/agent/**) — bearer token for external agent runtimes
  // (SuperMes/Hermes scouts). Separate from ADMIN_TOKEN so machine access can
  // be rotated independently. Empty (default) = agent API disabled (401).
  AGENT_API_TOKEN: z.string().default(''),
  SEED_USER_EMAIL: z.string().email(),
  SEED_USER_NAME: z.string().min(1),
  // Seed user password — lets `prisma/seed.ts` register Hugo through the real
  // Better Auth sign-up path. Defaults in dev for zero friction.
  SEED_USER_PASSWORD: z.string().min(8).default('changeme123'),
  // Better Auth.
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  // Public base URL for the browser auth client (inlined by Next at build).
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  // Google OAuth — optional. When empty, the Google provider is not mounted
  // (sign-in button disabled) so dev works without OAuth credentials.
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  // Chat LLM (Gemma). Ollama and OpenRouter both expose an OpenAI-compatible
  // API, so a single `ChatOpenAI` binding covers both via `baseURL`. All
  // server-only with defaults so the app boots without a chat backend.
  CHAT_LLM_PROVIDER: z.enum(['ollama', 'openrouter']).default('ollama'),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  // Tag of the model actually `ollama pull`ed — set to the real Gemma tag.
  OLLAMA_MODEL: z.string().default('gemma4:12b'),
  // Thinking toggle for the Ollama chat model, via the OpenAI-compatible
  // `reasoning_effort` param Ollama honours: 'none' disables the model's
  // chain-of-thought (cheaper, faster); 'low' | 'medium' | 'high' enable it.
  CHAT_THINKING_EFFORT: z.enum(['none', 'low', 'medium', 'high']).default('none'),
  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_MODEL: z.string().default('google/gemma-3-12b-it'),
  // Per-user monthly token ceiling; over it, the API refuses (429).
  CHAT_MONTHLY_TOKEN_CAP: z.coerce.number().int().positive().default(100000),
  // Tavily web search — powers the chat recommendation graph. Server-only,
  // default empty so the app boots without it; the pipeline degrades gracefully
  // (no cards, honest message) when unset.
  TAVILY_API_KEY: z.string().default(''),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. See errors above.');
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
