import {
  DatePresets,
  FilterValueSchema,
  isDateRange,
  type DateFilter,
  type FilterValue,
} from '../domain/FilterValue';

const DATE_RANGE_SEPARATOR = '..';

export function parseFilters(searchParams: URLSearchParams): FilterValue {
  const candidate: Record<string, unknown> = {};

  const kind = searchParams.get('kind');
  if (kind !== null) candidate.kind = kind;

  const neighborhood = searchParams.get('neighborhood');
  if (neighborhood !== null) candidate.neighborhood = parseCsv(neighborhood);

  const date = searchParams.get('date');
  if (date !== null) candidate.date = parseDate(date);

  const category = searchParams.get('category');
  if (category !== null) candidate.category = parseCsv(category);

  const priceMax = searchParams.get('priceMax');
  if (priceMax !== null) {
    const n = Number(priceMax);
    candidate.priceMax = Number.isFinite(n) ? n : priceMax;
  }

  for (const key of ['indoor', 'outdoor', 'free', 'paid'] as const) {
    const raw = searchParams.get(key);
    if (raw !== null) candidate[key] = parseBoolean(raw);
  }

  const result = FilterValueSchema.safeParse(candidate);
  return result.success ? result.data : {};
}

export function serializeFilters(value: FilterValue): URLSearchParams {
  const params = new URLSearchParams();

  if (value.kind !== undefined) params.set('kind', value.kind);
  if (value.neighborhood !== undefined) params.set('neighborhood', value.neighborhood.join(','));
  if (value.date !== undefined) params.set('date', serializeDate(value.date));
  if (value.category !== undefined) params.set('category', value.category.join(','));
  if (value.priceMax !== undefined) params.set('priceMax', String(value.priceMax));
  if (value.indoor !== undefined) params.set('indoor', String(value.indoor));
  if (value.outdoor !== undefined) params.set('outdoor', String(value.outdoor));
  if (value.free !== undefined) params.set('free', String(value.free));
  if (value.paid !== undefined) params.set('paid', String(value.paid));

  return params;
}

function parseCsv(raw: string): string[] {
  return raw.split(',');
}

function parseBoolean(raw: string): boolean | string {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}

function parseDate(raw: string): unknown {
  if ((DatePresets as readonly string[]).includes(raw)) return raw;
  const [from, to] = raw.split(DATE_RANGE_SEPARATOR);
  if (from && to) return { from, to };
  return raw;
}

function serializeDate(date: DateFilter): string {
  if (isDateRange(date)) return `${date.from}${DATE_RANGE_SEPARATOR}${date.to}`;
  return date;
}
