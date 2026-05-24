import { loadProfileView } from '../../modules/profile/web/loadProfileView';
import { ProfilePage } from '../../modules/profile/web/ProfilePage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const view = await loadProfileView();
  return (
    <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <ProfilePage view={view} />
      </main>
    </div>
  );
}
