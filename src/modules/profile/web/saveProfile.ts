import type { ProfileFormDTO } from '../../../shared/contracts/ProfileFormDTO';

/** PATCH the current user's profile. Throws on a non-2xx response. */
export async function saveProfile(form: ProfileFormDTO): Promise<void> {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!res.ok) throw new Error('save failed');
}
