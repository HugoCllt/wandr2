/** The six affinity categories surfaced as onboarding/edit sliders. */
export const PROFILE_AFFINITY_CATEGORIES = [
  'SPORT',
  'FOOD',
  'CULTURE',
  'OUTDOOR',
  'NIGHTLIFE',
  'ROMANTIC',
] as const;

export type ProfileAffinityCategory = (typeof PROFILE_AFFINITY_CATEGORIES)[number];

export type ProfileGender = 'MALE' | 'FEMALE' | 'OTHER';

/** Input for the profile form (onboarding popup + edit), body of PATCH /api/profile. */
export type ProfileFormDTO = {
  /** ISO calendar date, `yyyy-mm-dd`. */
  birthDate: string;
  gender: ProfileGender;
  cityId: string;
  bio: string;
  /** 0–10 affinity score per category. */
  affinities: Record<ProfileAffinityCategory, number>;
};
