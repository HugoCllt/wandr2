'use client';

import { useRouter } from 'next/navigation';

import {
  PROFILE_AFFINITY_CATEGORIES,
  type ProfileAffinityCategory,
  type ProfileFormDTO,
} from '../../../shared/contracts/ProfileFormDTO';
import { ProfileFormModal, type ProfileFormInitial } from './ProfileFormModal';

const DEFAULT_AFFINITY = 5;

function defaultAffinities(): Record<ProfileAffinityCategory, number> {
  return Object.fromEntries(
    PROFILE_AFFINITY_CATEGORIES.map((c) => [c, DEFAULT_AFFINITY]),
  ) as Record<ProfileAffinityCategory, number>;
}

/**
 * Mounted globally in the authenticated layout. Renders the blocking onboarding
 * popup until the user has an `onboardedAt`. Submit hits PATCH /api/profile;
 * a server refresh then clears the gate (onboardedAt is now set).
 */
export function OnboardingGate({
  onboardedAt,
  cityId,
}: {
  onboardedAt: Date | null;
  cityId: string;
}) {
  const router = useRouter();
  if (onboardedAt !== null) return null;

  const initial: ProfileFormInitial = {
    birthDate: '',
    gender: '',
    cityId,
    bio: '',
    affinities: defaultAffinities(),
  };

  async function onSubmit(form: ProfileFormDTO) {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error('save failed');
    router.refresh();
  }

  return <ProfileFormModal initial={initial} dismissable={false} onSubmit={onSubmit} />;
}
