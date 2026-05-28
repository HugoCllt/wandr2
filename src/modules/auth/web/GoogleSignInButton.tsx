'use client';

import { signIn } from '../../../shared/auth/auth-client';

/**
 * `enabled` is computed server-side from whether GOOGLE_CLIENT_* are set and
 * passed down — the client can't read those server-only env vars.
 */
export function GoogleSignInButton({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <button
        type="button"
        className="auth-google"
        disabled
        title="Google sign-in disabled in this environment"
      >
        Continue with Google
      </button>
    );
  }

  return (
    <button
      type="button"
      className="auth-google"
      onClick={() => signIn.social({ provider: 'google', callbackURL: '/' })}
    >
      Continue with Google
    </button>
  );
}
