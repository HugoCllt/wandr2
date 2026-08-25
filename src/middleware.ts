import { NextResponse, type NextRequest } from 'next/server';

const ALLOWED_AUTHORIZATION_ORIGINS = ['https://accounts.google.com'];

function authorizationOrigin(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const origin = authorizationOrigin(request.nextUrl.searchParams.get('authorizationURL'));
  if (!origin || !ALLOWED_AUTHORIZATION_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Invalid authorizationURL' }, { status: 400 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/expo-authorization-proxy'],
};
