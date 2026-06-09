'use client';

import { useState } from 'react';

import { Icon } from '../../../shared/ui/icons/Icon';
import { PremiumModal } from '../../../shared/ui/Premium';
import { ChatPage } from './ChatPage';

/**
 * Premium gate around the chat page. Non-premium members see the page rendered
 * but blurred and non-interactive, with the Premium modal open over it. Closing
 * the modal leaves the page locked behind a CTA to reopen it (upgrade is manual,
 * so the page never actually unlocks from here).
 */
export function ChatGate({ locked }: { locked: boolean }) {
  const [showModal, setShowModal] = useState(true);

  if (!locked) return <ChatPage />;

  return (
    <>
      <div
        aria-hidden
        style={{
          filter: 'blur(7px)',
          opacity: 0.55,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <ChatPage />
      </div>
      {showModal ? (
        <PremiumModal onClose={() => setShowModal(false)} />
      ) : (
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowModal(true)}
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 70,
          }}
        >
          <Icon name="gem" size={16} /> Débloquer avec Premium
        </button>
      )}
    </>
  );
}
