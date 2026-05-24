export type UserStat = {
  label: string;
  value: string;
  foot: string;
  footKind?: 'up' | 'warm' | '';
};

export type UserStats = UserStat[];
