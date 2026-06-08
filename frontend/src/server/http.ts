/** Small JSON request/response helpers for the REST routes. */
import type { TxType } from "@/types";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/** Thrown by validators; caught by the route to produce a 400. */
export class ValidationError extends Error {}

export function isTxType(v: unknown): v is TxType {
  return v === "income" || v === "expense";
}

/** A positive integer amount of whole VND. */
export function parseAmount(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n <= 0) {
    throw new ValidationError("amount must be a positive integer (whole VND)");
  }
  return n;
}

/** A YYYY-MM-DD date string. */
export function parseDate(v: unknown): string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    throw new ValidationError("date must be in YYYY-MM-DD format");
  }
  return v;
}

export function parseId(v: string | undefined): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** A YYYY-MM month string. */
export function parseMonth(v: unknown): string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}$/.test(v)) {
    throw new ValidationError("month must be in YYYY-MM format");
  }
  return v;
}
