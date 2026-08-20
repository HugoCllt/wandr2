'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { CityDTO } from '../../../shared/contracts/CityDTO';

const ActiveCityContext = createContext<CityDTO | null>(null);

/**
 * Carries the browsed city (server-resolved by `getActiveCity`) to client
 * components, so no card, map or label falls back to a hardcoded city.
 */
export function ActiveCityProvider({ city, children }: { city: CityDTO; children: ReactNode }) {
  return <ActiveCityContext.Provider value={city}>{children}</ActiveCityContext.Provider>;
}

export function useActiveCity(): CityDTO {
  const city = useContext(ActiveCityContext);
  if (!city) throw new Error('useActiveCity must be used inside <ActiveCityProvider>.');
  return city;
}
