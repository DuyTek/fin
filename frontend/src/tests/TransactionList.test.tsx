import { test, expect, describe } from "bun:test";
import { act, createElement } from "react";
import { TransactionList } from "@/components/TransactionList";
import type { TransactionWithCategory } from "@/types";
import { renderComponent } from "./utils/render";

mock.module("@/lib/api", () => ({
  api: {
    updateTransaction: async () => ({}),
    deleteTransaction: async () => ({ ok: true }),
  },
}));

import { mock } from "bun:test";

const sampleTx: TransactionWithCategory = {
  id: 1,
  type: "expense",
  amount: 50000,
  category_id: 1,
  category_name: "Food",
  note: "lunch",
  occurred_on: "2026-06-01",
  created_at: "2026-06-01T00:00:00Z",
};

describe("TransactionList", () => {
  test("shows loading text when loading=true and no transactions", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, { transactions: [], loading: true, onChanged: () => {} })
    );
    expect(container.textContent).toContain("Loading");
    unmount();
  });

  test("shows empty state when not loading and no transactions", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, { transactions: [], loading: false, onChanged: () => {} })
    );
    expect(container.textContent).toContain("No transactions this period");
    unmount();
  });

  test("renders a table row for each transaction", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [sampleTx],
        loading: false,
        onChanged: () => {},
      })
    );
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelectorAll("tbody tr").length).toBe(1);
    unmount();
  });

  test("shows transaction date, category name, and note", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [sampleTx],
        loading: false,
        onChanged: () => {},
      })
    );
    expect(container.textContent).toContain("2026-06-01");
    expect(container.textContent).toContain("Food");
    expect(container.textContent).toContain("lunch");
    unmount();
  });

  test("formats amount with VND symbol", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [sampleTx],
        loading: false,
        onChanged: () => {},
      })
    );
    expect(container.textContent).toContain("₫50,000");
    unmount();
  });

  test("shows Edit and Delete buttons for each row", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [sampleTx],
        loading: false,
        onChanged: () => {},
      })
    );
    const buttons = Array.from(container.querySelectorAll("button")).map(b => b.textContent);
    expect(buttons).toContain("Edit");
    expect(buttons).toContain("Delete");
    unmount();
  });

  test("clicking Edit shows Save and Cancel buttons", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [sampleTx],
        loading: false,
        onChanged: () => {},
      })
    );
    const editBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Edit"
    ) as HTMLButtonElement;
    act(() => { editBtn.click(); });
    const buttons = Array.from(container.querySelectorAll("button")).map(b => b.textContent);
    expect(buttons).toContain("Save");
    expect(buttons).toContain("Cancel");
    unmount();
  });

  test("clicking Cancel restores original values", () => {
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [sampleTx],
        loading: false,
        onChanged: () => {},
      })
    );
    const editBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Edit"
    ) as HTMLButtonElement;
    act(() => { editBtn.click(); });
    const cancelBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    ) as HTMLButtonElement;
    act(() => { cancelBtn.click(); });
    const buttons = Array.from(container.querySelectorAll("button")).map(b => b.textContent);
    expect(buttons).toContain("Edit");
    expect(buttons).toContain("Delete");
    unmount();
  });

  test("income transaction shows + prefix", () => {
    const incomeTx: TransactionWithCategory = { ...sampleTx, type: "income", category_name: "Salary" };
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [incomeTx],
        loading: false,
        onChanged: () => {},
      })
    );
    expect(container.textContent).toContain("+");
    unmount();
  });

  test("shows dash for empty note", () => {
    const noNoteTx: TransactionWithCategory = { ...sampleTx, note: "" };
    const { container, unmount } = renderComponent(
      createElement(TransactionList, {
        transactions: [noNoteTx],
        loading: false,
        onChanged: () => {},
      })
    );
    expect(container.textContent).toContain("—");
    unmount();
  });
});
