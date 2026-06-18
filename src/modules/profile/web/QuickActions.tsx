'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { ProfileFormDTO } from '../../../shared/contracts/ProfileFormDTO';
import { signOut } from '../../../shared/auth/auth-client';
import { Icon, type IconName } from '../../../shared/ui/icons/Icon';
import { ProfileFormModal, type ProfileFormInitial } from './ProfileFormModal';
import { saveProfile } from './saveProfile';

type QaIconKind = '' | 'warm' | 'ink' | 'cream';

function QaIcon({ icon, kind }: { icon: IconName; kind: QaIconKind }) {
  return (
    <span className={'qa-icon ' + kind}>
      <Icon name={icon} size={18} />
    </span>
  );
}

function QaBody({ name, meta }: { name: string; meta: string }) {
  return (
    <span>
      <div>{name}</div>
      <div className="qa-meta">{meta}</div>
    </span>
  );
}

export function QuickActions({
  counts,
  formInitial,
}: {
  counts: { favorites: number; history: number };
  formInitial: ProfileFormInitial;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function onSubmit(form: ProfileFormDTO) {
    await saveProfile(form);
    setEditing(false);
    router.refresh();
  }

  const historyMeta = `${counts.history} ${counts.history === 1 ? 'activity' : 'activities'}`;

  return (
    <div className="profile-actions">
      <h3>Quick Actions</h3>
      <div className="qa-grid">
        <Link href="/favorites" className="qa-btn">
          <QaIcon icon="heart" kind="warm" />
          <QaBody name="Favorites" meta={`${counts.favorites} saved`} />
          <Icon name="chev-right" size={14} />
        </Link>

        <button type="button" className="qa-btn" onClick={() => setEditing(true)}>
          <QaIcon icon="sparkle" kind="ink" />
          <QaBody name="Preferences" meta="Vibe & filters" />
          <Icon name="chev-right" size={14} />
        </button>

        <Link href="/calendar" className="qa-btn">
          <QaIcon icon="calendar" kind="cream" />
          <QaBody name="History" meta={historyMeta} />
          <Icon name="chev-right" size={14} />
        </Link>

        <button
          type="button"
          className="qa-btn"
          onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })}
        >
          <QaIcon icon="compass" kind="" />
          <QaBody name="Settings" meta="Sign out" />
          <Icon name="chev-right" size={14} />
        </button>
      </div>

      {editing && (
        <ProfileFormModal
          initial={formInitial}
          dismissable
          onSubmit={onSubmit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
