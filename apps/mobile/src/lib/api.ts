import { authClient } from './auth-client';
import { getCitySlug } from './city';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.clone().json()) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    return res.statusText || `Request failed with status ${res.status}`;
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const [cookie, citySlug] = await Promise.all([authClient.getCookie(), getCitySlug()]);
  const headers = new Headers(init.headers);
  if (cookie) headers.set('Cookie', cookie);
  headers.set('x-wandr-city', citySlug);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new ApiError(res.status, message);
  }
  return res;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  return (await res.json()) as T;
}
