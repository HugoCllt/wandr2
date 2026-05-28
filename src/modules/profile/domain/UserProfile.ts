export type UserProfile = {
  id: string;
  name: string;
  vibe: string;
  /** Avatar image URL, or null to fall back to generated initials. */
  avatarUrl: string | null;
  tags: { label: string; kind?: 'warm' | 'cool' | '' }[];
};
