const offsetFormatterCache = new Map<string, Intl.DateTimeFormat>();

function offsetFormatter(timeZone: string): Intl.DateTimeFormat {
  let cached = offsetFormatterCache.get(timeZone);
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    offsetFormatterCache.set(timeZone, cached);
  }
  return cached;
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    offsetFormatter(timeZone).formatToParts(date).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

export function zonedLocalToUtc(
  timeZone: string,
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  const utcGuess = Date.UTC(year, monthIndex, day, hour, minute, second, ms);
  const offset = tzOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
}

export type MonthRange = {
  year: number;
  monthIndex: number;
  fromUtc: Date;
  toUtc: Date;
  prev: { year: number; monthIndex: number };
  next: { year: number; monthIndex: number };
};

export function parseMonthParam(
  param: string | null | undefined,
  now: Date,
  timeZone: string,
): MonthRange {
  let year: number;
  let monthIndex: number;
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      monthIndex = m - 1;
    } else {
      ({ year, monthIndex } = currentMonth(now, timeZone));
    }
  } else {
    ({ year, monthIndex } = currentMonth(now, timeZone));
  }

  const fromUtc = zonedLocalToUtc(timeZone, year, monthIndex, 1, 0, 0, 0, 0);
  const nextStart = zonedLocalToUtc(timeZone, year, monthIndex + 1, 1, 0, 0, 0, 0);
  const toUtc = new Date(nextStart.getTime() - 1);
  const prev =
    monthIndex === 0 ? { year: year - 1, monthIndex: 11 } : { year, monthIndex: monthIndex - 1 };
  const next =
    monthIndex === 11 ? { year: year + 1, monthIndex: 0 } : { year, monthIndex: monthIndex + 1 };
  return { year, monthIndex, fromUtc, toUtc, prev, next };
}

function currentMonth(now: Date, timeZone: string): { year: number; monthIndex: number } {
  const parts = Object.fromEntries(
    offsetFormatter(timeZone).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { year: Number(parts.year), monthIndex: Number(parts.month) - 1 };
}

export function formatMonthParam(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}
