export type ActivityHistoryStatus = 'went' | 'saved' | 'upcoming';

export type UserActivityHistoryEntry = {
  id: string;
  title: string;
  meta: string;
  date: string;
  status: ActivityHistoryStatus;
  imageUrl: string;
};
