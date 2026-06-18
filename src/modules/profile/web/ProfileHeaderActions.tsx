'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ProfileFormDTO } from '../../../shared/contracts/ProfileFormDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import { SignOutButton } from '../../auth/web/SignOutButton';
import { ProfileFormModal, type ProfileFormInitial } from './ProfileFormModal';
import { saveProfile } from './saveProfile';

export function ProfileHeaderActions({ initial }: { initial: ProfileFormInitial }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onSubmit(form: ProfileFormDTO) {
    await saveProfile(form);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="profile-header-actions">
        <button type="button" className="profile-edit" onClick={() => setOpen(true)}>
          <Icon name="sparkle" size={14} /> Edit profile
        </button>
        <SignOutButton />
      </div>
      {open && (
        <ProfileFormModal
          initial={initial}
          dismissable
          onSubmit={onSubmit}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
