import type { ReactNode } from 'react';

import { ActivityProvider } from '../modules/activities/web/ActivityModal';
import { ChatFAB } from '../modules/chat/web/ChatFAB';
import { Nav } from '../shared/ui/Nav';

import './globals.css';

export const metadata = {
  title: 'Wandr',
  description: 'Discover Montréal — events, places, and your own little calendar.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <ActivityProvider>
          <div className="page">
            <Nav />
            {children}
          </div>
          <ChatFAB />
        </ActivityProvider>
      </body>
    </html>
  );
}
