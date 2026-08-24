export type ProfileTagDTO = { label: string; kind?: 'warm' | 'cool' | '' };

export type ProfileStatDTO = {
  label: string;
  value: string;
  foot: string;
  footKind?: 'up' | 'warm' | '';
};

export type ProfileBreakdownItemDTO = {
  name: string;
  iconKey: string;
  percent: number;
  cool?: boolean;
};

export type ProfileHistoryEntryDTO = {
  id: string;
  title: string;
  meta: string;
  date: string;
  status: 'went' | 'saved' | 'upcoming';
  imageUrl: string;
};

export type ProfileViewDTO = {
  profile: {
    id: string;
    name: string;
    vibe: string;
    avatarUrl: string | null;
    tags: ProfileTagDTO[];
  };
  stats: ProfileStatDTO[];
  breakdown: ProfileBreakdownItemDTO[];
  history: ProfileHistoryEntryDTO[];
  counts: { favorites: number; history: number };
};
