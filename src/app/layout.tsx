import type { ReactNode } from 'react';

import { ActiveCityProvider } from '../modules/activities/web/ActiveCityProvider';
import { getActiveCity, listCities, toCityDTO } from '../modules/activities/web/activeCity';
import { ActivityProvider } from '../modules/activities/web/ActivityModal';
import { CitySearch } from '../modules/activities/web/CitySearch';
import { ChatFAB } from '../modules/chat/web/ChatFAB';
import { Nav } from '../shared/ui/Nav';

import './globals.css';

export const metadata = {
  title: 'Wandr',
  description: 'Discover your city — events, places, and your own little calendar.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [activeCity, cities] = await Promise.all([getActiveCity(), listCities()]);
  const city = toCityDTO(activeCity);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Libre+Bodoni:wght@400;500;600;700&family=Public+Sans:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <ActiveCityProvider city={city}>
          <ActivityProvider>
            <div className="page">
              <Nav citySearch={<CitySearch cities={cities} active={city} />} />
              {children}
            </div>
            <ChatFAB />
          </ActivityProvider>
        </ActiveCityProvider>
      </body>
    </html>
  );
}
