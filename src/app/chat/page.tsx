import { ChatPage } from '../../modules/chat/web/ChatPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <ChatPage />
      </main>
    </div>
  );
}
