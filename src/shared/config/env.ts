import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_TOKEN: z.string().min(1),
  SEED_USER_EMAIL: z.string().email(),
  SEED_USER_NAME: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. See errors above.');
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
