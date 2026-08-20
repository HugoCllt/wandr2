const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, key: string, options: Intl.DateTimeFormatOptions) {
  const cacheKey = `${timeZone}|${key}`;
  let cached = formatterCache.get(cacheKey);
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-CA', { timeZone, ...options });
    formatterCache.set(cacheKey, cached);
  }
  return cached;
}

export function formatDateInTZ(value: Date | string, timeZone: string): string {
  return formatter(timeZone, 'date', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(toDate(value));
}

export function formatDateTimeInTZ(value: Date | string, timeZone: string): string {
  return formatter(timeZone, 'dateTime', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(toDate(value));
}

export function formatTimeInTZ(value: Date | string, timeZone: string): string {
  return formatter(timeZone, 'time', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(toDate(value));
}

export function dayKeyInTZ(value: Date | string, timeZone: string): string {
  return formatter(timeZone, 'dayKey', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(toDate(value));
}

export function formatMonthInTZ(value: Date | string, timeZone: string): string {
  return formatter(timeZone, 'month', { month: 'long', year: 'numeric' }).format(toDate(value));
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
