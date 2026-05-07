const MONTREAL_TZ = 'America/Toronto';

const dateOnlyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MONTREAL_TZ,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MONTREAL_TZ,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const timeOnlyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MONTREAL_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MONTREAL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const monthLabelFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MONTREAL_TZ,
  month: 'long',
  year: 'numeric',
});

export function formatDateInTZ(value: Date | string): string {
  return dateOnlyFormatter.format(toDate(value));
}

export function formatDateTimeInTZ(value: Date | string): string {
  return dateTimeFormatter.format(toDate(value));
}

export function formatTimeInTZ(value: Date | string): string {
  return timeOnlyFormatter.format(toDate(value));
}

export function dayKeyInTZ(value: Date | string): string {
  return dayKeyFormatter.format(toDate(value));
}

export function formatMonthInTZ(value: Date | string): string {
  return monthLabelFormatter.format(toDate(value));
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
