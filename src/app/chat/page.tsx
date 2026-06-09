import { ChatGate } from '../../modules/chat/web/ChatGate';
import { getCurrentUser } from '../../shared/auth/current-user';
import { requireSession } from '../../shared/auth/require-session';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireSession();
  const user = await getCurrentUser();
  return (
    <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <ChatGate locked={!user.isPremium} />
      </main>
    </div>
  );
}
