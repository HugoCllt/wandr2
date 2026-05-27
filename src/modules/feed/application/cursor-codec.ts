import { z } from 'zod';

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const CursorSchema = z
  .object({
    featured: z.boolean(),
    matchScore: z.number().min(0).max(10),
    dateStart: z.string().regex(ISO_DATE_TIME).nullable(),
    createdAt: z.string().regex(ISO_DATE_TIME),
    id: z.string().min(1),
  })
  .strict();

export type FeedCursorKey = z.infer<typeof CursorSchema>;

export function encodeCursor(key: FeedCursorKey): string {
  const json = JSON.stringify(key);
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeCursor(token: string | null | undefined): FeedCursorKey | null {
  if (!token) return null;

  let json: string;
  try {
    json = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  const result = CursorSchema.safeParse(parsed);
  return result.success ? result.data : null;
}
