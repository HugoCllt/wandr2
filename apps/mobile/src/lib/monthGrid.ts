export type MonthGridCell = {
  year: number;
  monthIndex: number;
  day: number;
  outside: boolean;
};

export function buildMonthGrid(year: number, monthIndex: number): MonthGridCell[] {
  const first = new Date(year, monthIndex, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrev = new Date(year, monthIndex, 0).getDate();
  const cells: MonthGridCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      year: monthIndex === 0 ? year - 1 : year,
      monthIndex: monthIndex === 0 ? 11 : monthIndex - 1,
      day: daysInPrev - i,
      outside: true,
    });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ year, monthIndex, day, outside: false });
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length - 1];
    let nextDay = last.day + 1;
    let nextMonth = last.monthIndex;
    let nextYear = last.year;
    if (nextDay > new Date(nextYear, nextMonth + 1, 0).getDate()) {
      nextDay = 1;
      nextMonth += 1;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
    }
    cells.push({ year: nextYear, monthIndex: nextMonth, day: nextDay, outside: nextMonth !== monthIndex });
    if (cells.length >= 42) break;
  }
  return cells;
}

export function dayKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function localDayKey(iso: string): string {
  const d = new Date(iso);
  return dayKey(d.getFullYear(), d.getMonth(), d.getDate());
}
