import { test, expect, describe, mock } from "bun:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import type { AsyncState } from "@/hooks/useAsync";

mock.module("@/lib/api", () => ({
  api: {
    listCategories: async () => [
      { id: 1, name: "Food", type: "expense", is_custom: 0, created_at: "2026-01-01" },
    ],
    listTransactions: async () => [
      { id: 1, type: "expense", amount: 50000, category_id: 1, note: "", occurred_on: "2026-06-01", created_at: "2026-06-01", category_name: "Food" },
    ],
    getSummary: async () => ({
      income: 100000,
      expense: 50000,
      balance: 50000,
      expense_by_category: [],
    }),
  },
}));

function renderHook<T>(render: () => T): { result: { current: T }; unmount: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const result = { current: undefined as T };

  function Capture() {
    result.current = render();
    return null;
  }

  const root = createRoot(container);
  act(() => { root.render(createElement(Capture)); });

  return {
    result: result as { current: T },
    unmount: () => {
      act(() => { root.unmount(); });
      container.remove();
    },
  };
}

describe("useCategories", () => {
  test("starts loading then resolves category list", async () => {
    const { useCategories } = await import("@/hooks/useFinance");
    const { result, unmount } = renderHook(() => useCategories());
    expect(result.current.loading).toBe(true);
    await act(async () => { await Promise.resolve(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("Food");
    unmount();
  });
});

describe("useTransactions", () => {
  test("resolves transaction list with category name", async () => {
    const { useTransactions } = await import("@/hooks/useFinance");
    const { result, unmount } = renderHook(() =>
      useTransactions("2026-06-01", "2026-06-30")
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].category_name).toBe("Food");
    expect(result.current.data![0].amount).toBe(50000);
    unmount();
  });
});

describe("useSummary", () => {
  test("resolves summary totals", async () => {
    const { useSummary } = await import("@/hooks/useFinance");
    const { result, unmount } = renderHook(() =>
      useSummary("2026-06-01", "2026-06-30")
    );
    await act(async () => { await Promise.resolve(); });
    const s = result.current.data as AsyncState<{ income: number; expense: number; balance: number }>["data"];
    expect(s?.income).toBe(100000);
    expect(s?.expense).toBe(50000);
    expect(s?.balance).toBe(50000);
    unmount();
  });
});
