/**
 * Shared types used by both the Bun server and the React frontend.
 * Amounts are always whole VND integers (đồng has no minor units).
 */

export type TxType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  type: TxType;
  /** 0 = built-in (seeded), 1 = user-created */
  is_custom: 0 | 1;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: TxType;
  /** whole VND */
  amount: number;
  category_id: number;
  note: string;
  /** YYYY-MM-DD */
  occurred_on: string;
  created_at: string;
}

/** A transaction joined with its category name, as returned by the list API. */
export interface TransactionWithCategory extends Transaction {
  category_name: string;
}

/** One row of the per-category expense breakdown. */
export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  total: number;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  /** expense totals grouped by category, descending */
  expense_by_category: CategoryBreakdown[];
}

// ---- Request payloads ----

export interface CreateCategoryInput {
  name: string;
  type: TxType;
}

export interface CreateTransactionInput {
  type: TxType;
  amount: number;
  category_id: number;
  note?: string;
  occurred_on: string;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;
