import type { ReactNode } from 'react';

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
  const [user, neighborhoods] = await Promise.all([getOptionalUser(), listNeighborhoods()]);

  return (
    <SmoothScroll>
      <TopFilters neighborhoods={neighborhoods} />
      <div className="shell">
        <main className="main">{children}</main>
        <Premium />
      </div>
      <SiteFooter />
      {user && <OnboardingGate onboardedAt={user.onboardedAt} cityId={user.cityId} />}
    </SmoothScroll>
  );
}
