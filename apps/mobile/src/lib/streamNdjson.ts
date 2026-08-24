import { fetch as expoFetch } from 'expo/fetch';
import type { ChatStreamEvent } from '@wandr/shared';
import { authClient } from './auth-client';
import { getCitySlug } from './city';
import { ApiError } from './api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type ExpoFetchResponse = Awaited<ReturnType<typeof expoFetch>>;

async function extractStreamErrorMessage(res: ExpoFetchResponse): Promise<string> {
  try {
    const body = (await res.clone().json()) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    return res.statusText || `Request failed with status ${res.status}`;
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

export async function streamNdjson(
  path: string,
  body: unknown,
  onEvent: (event: ChatStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const [cookie, citySlug] = await Promise.all([authClient.getCookie(), getCitySlug()]);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-wandr-city': citySlug,
  };
  if (cookie) headers.Cookie = cookie;

  const res = await expoFetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const message = await extractStreamErrorMessage(res);
    throw new ApiError(res.status, message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line.length === 0) continue;
      onEvent(JSON.parse(line) as ChatStreamEvent);
    }
  }

  const lastLine = buffer.trim();
  if (lastLine.length > 0) {
    onEvent(JSON.parse(lastLine) as ChatStreamEvent);
  }
}
