import type { FilterValueDTO } from '@wandr/shared';

export type { FilterValueDTO };

export function emptyFilters(): FilterValueDTO {
  return {};
}

export function countActiveFilters(filters: FilterValueDTO): number {
  return Object.values(filters).filter((value) => value !== undefined).length;
}
