import type { FilterValueDTO } from './FilterValueDTO';

export type FeedQueryDTO = {
  filters: FilterValueDTO;
  cursor: string | null;
  limit: number;
};
