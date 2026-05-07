import { isDateRange, type DateFilter } from '../../filters/domain/FilterValue';

const TZ = 'America/Toronto';
const DAY_MS = 24 * 60 * 60 * 1000;

export function resolveEventDateWindow(date: DateFilter, now: Date): { from: Date; to: Date } {
  if (isDateRange(date)) {
    const from = torontoMidnightUtc(parseYmd(date.from));
    const to = endOfTorontoDayUtc(parseYmd(date.to));
    return { from, to };
  }

  const today = torontoYmd(now);

  if (date === 'today') {
    const start = torontoMidnightUtc(today);
    return { from: start, to: endOfTorontoDayUtc(today) };
  }

  // 'weekend' — current weekend if today is Sat or Sun, otherwise the upcoming Sat-Sun.
  const weekday = today.weekday;
  if (weekday === 0) {
    const start = torontoMidnightUtc(today);
    return { from: start, to: endOfTorontoDayUtc(today) };
  }
  const daysToSat = (6 - weekday + 7) % 7;
  const satStart = new Date(torontoMidnightUtc(today).getTime() + daysToSat * DAY_MS);
  const sunEndMs = satStart.getTime() + 2 * DAY_MS - 1;
  return { from: satStart, to: new Date(sunEndMs) };
}

type Ymd = { y: number; m: number; d: number; weekday: number };

function parseYmd(iso: string): Ymd {
  const [y, m, d] = iso.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const weekday = new Date(utc).getUTCDay();
  return { y, m, d, weekday };
}

function torontoYmd(at: Date): Ymd {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  };
}

function torontoOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  let hour = get('hour');
  if (hour === 24) hour = 0;
  const wallMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  );
  return Math.round((wallMs - at.getTime()) / 60000);
}

function torontoMidnightUtc(ymd: Pick<Ymd, 'y' | 'm' | 'd'>): Date {
  const naive = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 0, 0, 0));
  const offsetMin = torontoOffsetMinutes(naive);
  return new Date(naive.getTime() - offsetMin * 60000);
}

function endOfTorontoDayUtc(ymd: Pick<Ymd, 'y' | 'm' | 'd'>): Date {
  return new Date(torontoMidnightUtc(ymd).getTime() + DAY_MS - 1);
}
