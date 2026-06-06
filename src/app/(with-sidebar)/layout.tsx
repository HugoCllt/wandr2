import type { ReactNode } from 'react';

import { listNeighborhoods } from '../../modules/activities/web/listNeighborhoods';
import { TopFilters } from '../../modules/filters/web/TopFilters';
import { OnboardingGate } from '../../modules/profile/web/OnboardingGate';
import { requireSession } from '../../shared/auth/require-session';
import { prisma } from '../../shared/db/prisma';

export default async function WithSidebarLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const [user, neighborhoods] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { onboardedAt: true, cityId: true },
    }),
    listNeighborhoods(),
  ]);

  return (
    <>
      <TopFilters neighborhoods={neighborhoods} />
      <div className="shell">
        <main className="main">{children}</main>
      </div>
      <OnboardingGate onboardedAt={user.onboardedAt} cityId={user.cityId} />
    </>
  );
}
