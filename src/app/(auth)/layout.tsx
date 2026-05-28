import type { ReactNode } from 'react';

// Minimal auth layout — no sidebar, no edge art. Centers its child card.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-shell">{children}</div>;
}
