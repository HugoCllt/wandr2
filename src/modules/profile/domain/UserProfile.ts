export type UserProfile = {
  id: string;
  name: string;
  vibe: string;
  avatarUrl: string;
  tags: { label: string; kind?: 'warm' | 'cool' | '' }[];
};
