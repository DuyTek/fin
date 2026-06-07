/**
 * Pure budget math helpers — no DB or React imports.
 * Amounts are whole VND integers throughout.
 */
import type { BudgetStatus } from "@/types";

/**
 * Projected end-of-month spend based on the daily average so far.
 * Returns 0 when no days have elapsed yet (avoids division by zero).
 */
export function calcForecast(
  spent: number,
  daysElapsed: number,
  daysInMonth: number,
): number {
  if (daysElapsed <= 0) return 0;
  return Math.round((spent / daysElapsed) * daysInMonth);
}

/**
 * Guardrail status: on_track (<80 %), warning (80–100 %), exceeded (>100 %).
 * Falls back to "on_track" when cap is zero to avoid division by zero.
 */
export function calcStatus(spent: number, cap: number): BudgetStatus {
  if (cap <= 0) return "on_track";
  const ratio = spent / cap;
  if (ratio > 1) return "exceeded";
  if (ratio >= 0.8) return "warning";
  return "on_track";
}

/**
 * Percentage of the budget cap consumed, rounded to the nearest integer.
 * Returns 0 when cap is zero.
 */
export function calcPercentUsed(spent: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.round((spent / cap) * 100);
}
