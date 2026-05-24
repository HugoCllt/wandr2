import type { ReactNode } from 'react';

import { listNeighborhoods } from '../../modules/activities/web/listNeighborhoods';
import { TopFilters } from '../../modules/filters/web/TopFilters';
import { EdgeArtLeft } from '../../shared/ui/decor/EdgeArtLeft';
import { EdgeArtRight } from '../../shared/ui/decor/EdgeArtRight';

export default async function WithSidebarLayout({ children }: { children: ReactNode }) {
  const neighborhoods = await listNeighborhoods();

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
        <main className="main">{children}</main>
      </div>
    </>
  );
}
