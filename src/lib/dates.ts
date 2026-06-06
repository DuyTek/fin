/** Date helpers working in YYYY-MM-DD / YYYY-MM strings (local, no TZ math). */

/** "2026-06-06" for today. */
export function todayISO(): string {
  const d = new Date();
  return toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Current month as "YYYY-MM". */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** First and last day of a "YYYY-MM" month, inclusive. */
export function monthRange(month: string): { from: string; to: string } {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const lastDay = new Date(y, m, 0).getDate(); // day 0 of next month = last of this
  return { from: toISODate(y, m, 1), to: toISODate(y, m, lastDay) };
}

/** Shift a "YYYY-MM" by ±n months. */
export function shiftMonth(month: string, delta: number): string {
  const [yStr, mStr] = month.split("-");
  const d = new Date(Number(yStr), Number(mStr) - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** "2026-06" -> "June 2026" */
export function formatMonthLabel(month: string): string {
  const [yStr, mStr] = month.split("-");
  const d = new Date(Number(yStr), Number(mStr) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}
