/**
 * Finance resource hooks — thin wrappers over the generic `useAsync` that
 * supply a fetcher and refetch deps. Mutations live in `@/lib/api`; call a
 * hook's `reload()` after mutating to refresh.
 */
import { api } from "@/lib/api";
import { useAsync, type AsyncState } from "@/hooks/useAsync";
import type { Category, Summary, TransactionWithCategory } from "@/types";

export type { AsyncState } from "@/hooks/useAsync";

export function useCategories(): AsyncState<Category[]> {
  return useAsync<Category[]>([], () => api.listCategories(), []);
}

export function useTransactions(from: string, to: string): AsyncState<TransactionWithCategory[]> {
  return useAsync<TransactionWithCategory[]>(
    [],
    () => api.listTransactions({ from, to }),
    [from, to],
  );
}

export function useSummary(from: string, to: string): AsyncState<Summary> {
  return useAsync<Summary>(
    { income: 0, expense: 0, balance: 0, expense_by_category: [] },
    () => api.getSummary(from, to),
    [from, to],
  );
}
