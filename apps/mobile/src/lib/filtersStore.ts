import { useSyncExternalStore } from 'react';
import type { CategoryKey, FilterValueDTO } from '@wandr/shared';
import { emptyFilters } from './filtersState';

export type FilterScope = 'home' | CategoryKey;

const snapshots = new Map<FilterScope, FilterValueDTO>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getScopedFilters(scope: FilterScope): FilterValueDTO {
  const current = snapshots.get(scope);
  if (current !== undefined) return current;
  const initial = emptyFilters();
  snapshots.set(scope, initial);
  return initial;
}

export function setScopedFilters(scope: FilterScope, next: FilterValueDTO): void {
  if (snapshots.get(scope) === next) return;
  snapshots.set(scope, next);
  listeners.forEach((listener) => listener());
}

export function useScopedFilters(scope: FilterScope): FilterValueDTO {
  return useSyncExternalStore(subscribe, () => getScopedFilters(scope));
}
