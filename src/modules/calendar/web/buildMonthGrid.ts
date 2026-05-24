export type CalendarGridCell = {
  y: number;
  m: number;
  d: number;
  outside: boolean;
};

export function buildMonthGrid(y: number, m: number): CalendarGridCell[] {
  const first = new Date(y, m, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const cells: CalendarGridCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      y: m === 0 ? y - 1 : y,
      m: m === 0 ? 11 : m - 1,
      d: daysInPrev - i,
      outside: true,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ y, m, d, outside: false });
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length - 1];
    let nd = last.d + 1;
    let nm = last.m;
    let ny = last.y;
    if (nd > new Date(ny, nm + 1, 0).getDate()) {
      nd = 1;
      nm += 1;
      if (nm > 11) {
        nm = 0;
        ny += 1;
      }
    }
    cells.push({ y: ny, m: nm, d: nd, outside: nm !== m });
    if (cells.length >= 42) break;
  }
  return cells;
}
