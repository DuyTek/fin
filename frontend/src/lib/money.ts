/**
 * VND money helpers. Amounts are whole integers (đồng has no minor units).
 * Display/input uses thousand separators: 10000 -> "10,000".
 */

const groups = new Intl.NumberFormat("en-US");

/** 10000 -> "10,000" */
export function formatVND(amount: number): string {
  return groups.format(Math.trunc(amount));
}

/** 10000 -> "₫10,000" */
export function formatVNDSymbol(amount: number): string {
  const n = Math.trunc(amount);
  const sign = n < 0 ? "-" : "";
  return `${sign}₫${groups.format(Math.abs(n))}`;
}

/**
 * Parse user-typed text into a whole-VND integer, ignoring commas/spaces and
 * the ₫ symbol. Returns 0 for empty/invalid input. Negative signs and decimals
 * are dropped (VND has no fractional part).
 */
export function parseVND(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}
