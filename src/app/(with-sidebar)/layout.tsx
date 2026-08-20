import type { ReactNode } from 'react';

import { getActiveCity } from '../../modules/activities/web/activeCity';
import { listNeighborhoods } from '../../modules/activities/web/listNeighborhoods';
import { TopFilters } from '../../modules/filters/web/TopFilters';
import { OnboardingGate } from '../../modules/profile/web/OnboardingGate';
import { getOptionalUser } from '../../shared/auth/current-user';
import { Premium } from '../../shared/ui/Premium';
import { SiteFooter } from '../../shared/ui/SiteFooter';
import { SmoothScroll } from '../../shared/ui/SmoothScroll';

export default async function WithSidebarLayout({ children }: { children: ReactNode }) {
  // Login is not mandatory here — anonymous visitors browse the feed. The
  // onboarding popup only surfaces for a signed-in user's first connection.
  const [user, city] = await Promise.all([getOptionalUser(), getActiveCity()]);
  const neighborhoods = await listNeighborhoods(city.id);

  return (
    <SmoothScroll>
      <TopFilters neighborhoods={neighborhoods} />
      <div className="shell">
        <main className="main">{children}</main>
        <Premium cityName={city.name} />
      </div>
      <SiteFooter cityName={city.name} />
      {user && (
        <OnboardingGate
          onboardedAt={user.onboardedAt}
          cityId={user.cityId}
          cityName={user.cityName}
        />
      )}
    </SmoothScroll>
  );
}
