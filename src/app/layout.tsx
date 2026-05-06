import type { ReactNode } from 'react';

export const metadata = {
  title: 'Wandr',
  description: 'Discover Montréal — events, places, and your own little calendar.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
