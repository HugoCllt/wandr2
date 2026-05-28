'use client';

import { useRouter } from 'next/navigation';

import { signOut } from '../../../shared/auth/auth-client';

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="profile-signout"
      onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })}
    >
      Sign out
    </button>
  );
}
