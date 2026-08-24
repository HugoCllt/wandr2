import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [expoClient({ scheme: 'wandr', storagePrefix: 'wandr', storage: SecureStore })],
});

export const { useSession } = authClient;

export type SessionData = NonNullable<ReturnType<typeof authClient.useSession>['data']>;
export type SessionUser = SessionData['user'] & { onboardedAt: Date | string | null };
