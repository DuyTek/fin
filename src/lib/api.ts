/** Typed fetch wrappers for the finance REST API. */
import type {
  Category,
  CreateCategoryInput,
  CreateTransactionInput,
  Summary,
  Transaction,
  TransactionWithCategory,
  TxType,
  UpdateTransactionInput,
} from "@/types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export interface TxQuery {
  from?: string;
  to?: string;
  type?: TxType;
  category_id?: number;
}

export const api = {
  // Categories
  listCategories: (type?: TxType) =>
    req<Category[]>(`/api/categories${qs({ type })}`),
  createCategory: (input: CreateCategoryInput) =>
    req<Category>("/api/categories", { method: "POST", body: JSON.stringify(input) }),
  deleteCategory: (id: number) =>
    req<{ ok: true }>(`/api/categories/${id}`, { method: "DELETE" }),

  // Transactions
  listTransactions: (q: TxQuery = {}) =>
    req<TransactionWithCategory[]>(`/api/transactions${qs({ ...q })}`),
  createTransaction: (input: CreateTransactionInput) =>
    req<Transaction>("/api/transactions", { method: "POST", body: JSON.stringify(input) }),
  updateTransaction: (id: number, input: UpdateTransactionInput) =>
    req<Transaction>(`/api/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteTransaction: (id: number) =>
    req<{ ok: true }>(`/api/transactions/${id}`, { method: "DELETE" }),

  // Summary
  getSummary: (from?: string, to?: string) =>
    req<Summary>(`/api/summary${qs({ from, to })}`),
};
