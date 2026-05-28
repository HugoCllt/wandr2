import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_TOKEN: z.string().min(1),
  SEED_USER_EMAIL: z.string().email(),
  SEED_USER_NAME: z.string().min(1),
  // Seed user password — lets `prisma/seed.ts` register Hugo through the real
  // Better Auth sign-up path. Defaults in dev for zero friction.
  SEED_USER_PASSWORD: z.string().min(8).default('changeme123'),
  // Better Auth.
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  // Google OAuth — optional. When empty, the Google provider is not mounted
  // (sign-in button disabled) so dev works without OAuth credentials.
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. See errors above.');
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
