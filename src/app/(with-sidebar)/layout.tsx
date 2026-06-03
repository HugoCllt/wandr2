import type { ReactNode } from 'react';

import { listNeighborhoods } from '../../modules/activities/web/listNeighborhoods';
import { listUrgentActivities } from '../../modules/activities/web/listUrgentActivities';
import { UrgentEventsSection } from '../../modules/activities/web/UrgentEventsSection';
import { TopFilters } from '../../modules/filters/web/TopFilters';
import { OnboardingGate } from '../../modules/profile/web/OnboardingGate';
import { requireSession } from '../../shared/auth/require-session';
import { prisma } from '../../shared/db/prisma';
import { EdgeArtLeft } from '../../shared/ui/decor/EdgeArtLeft';
import { EdgeArtRight } from '../../shared/ui/decor/EdgeArtRight';

export default async function WithSidebarLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { onboardedAt: true, cityId: true },
  });
  const [neighborhoods, urgent] = await Promise.all([
    listNeighborhoods(),
    listUrgentActivities(user.cityId, 6),
  ]);

  return (
    <>
      <div className="edge-art left">
        <EdgeArtLeft />
      </div>
      <div className="edge-art right">
        <EdgeArtRight />
      </div>
      <div className="shell">
        <TopFilters neighborhoods={neighborhoods} />
        <main className="main">
          <UrgentEventsSection activities={urgent} />
          {children}
        </main>
      </div>
      <OnboardingGate onboardedAt={user.onboardedAt} cityId={user.cityId} />
    </>
  );
}
