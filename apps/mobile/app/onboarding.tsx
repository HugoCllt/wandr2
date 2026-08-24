import {
  PROFILE_AFFINITY_CATEGORIES,
  type ProfileAffinityCategory,
  type ProfileFormDTO,
} from '@wandr/shared';
import { ProfileForm, type ProfileFormInitial } from '../src/components/ProfileForm';
import { useSession, type SessionUser } from '../src/lib/auth-client';
import { useUpdateProfile } from '../src/lib/queries/useProfile';

const DEFAULT_AFFINITY = 5;
const DEFAULT_CITY_NAME = 'Montréal';

function defaultAffinities(): Record<ProfileAffinityCategory, number> {
  return Object.fromEntries(
    PROFILE_AFFINITY_CATEGORIES.map((category) => [category, DEFAULT_AFFINITY]),
  ) as Record<ProfileAffinityCategory, number>;
}

export default function OnboardingScreen() {
  const { data: session, refetch } = useSession();
  const updateProfile = useUpdateProfile();
  const user = session?.user as (SessionUser & { cityId?: string }) | undefined;

  const initial: ProfileFormInitial = {
    birthDate: '',
    gender: '',
    cityId: user?.cityId ?? '',
    cityName: DEFAULT_CITY_NAME,
    bio: '',
    affinities: defaultAffinities(),
  };

  async function handleSubmit(form: ProfileFormDTO) {
    await updateProfile.mutateAsync(form);
    await refetch();
  }

  return <ProfileForm initial={initial} dismissable={false} onSubmit={handleSubmit} />;
}
