import { loadProfileFormInitial, loadProfileView } from '../../modules/profile/web/loadProfileView';
import { ProfilePage } from '../../modules/profile/web/ProfilePage';
import { requireSession } from '../../shared/auth/require-session';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireSession();
  const [view, formInitial] = await Promise.all([loadProfileView(), loadProfileFormInitial()]);
  return (
    <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <ProfilePage view={view} formInitial={formInitial} />
      </main>
    </div>
  );
}
