import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { GoogleSignInButton } from '../../../modules/auth/web/GoogleSignInButton';
import { SignInForm } from '../../../modules/auth/web/SignInForm';
import { auth } from '../../../shared/auth/auth';
import { env } from '../../../shared/config/env';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: headers() });
  if (session) redirect('/');

  const googleEnabled = !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;

  return (
    <div className="auth-card">
      <div className="auth-brand">Wandr</div>
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-sub">Discover Montréal — events, places, and your own little calendar.</p>

      <SignInForm />

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleSignInButton enabled={googleEnabled} />
    </div>
  );
}
