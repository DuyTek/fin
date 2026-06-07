import { test, expect, describe } from "bun:test";
import { act, createElement } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import type { Summary } from "@/types";
import { renderComponent } from "./utils/render";

const emptySummary: Summary = {
  income: 0,
  expense: 0,
  balance: 0,
  expense_by_category: [],
};

describe("SummaryCards", () => {
  test("shows 'No expenses this period' when expense_by_category is empty", () => {
    const { container, unmount } = renderComponent(
      createElement(SummaryCards, { summary: emptySummary })
    );
    expect(container.textContent).toContain("No expenses this period");
    unmount();
  });

  test("renders income, expense, and balance card labels", () => {
    const { container, unmount } = renderComponent(
      createElement(SummaryCards, { summary: emptySummary })
    );
    expect(container.textContent).toContain("Income");
    expect(container.textContent).toContain("Expense");
    expect(container.textContent).toContain("Balance");
    unmount();
  });

  test("formats income amount as VND symbol", () => {
    const summary: Summary = { ...emptySummary, income: 100000 };
    const { container, unmount } = renderComponent(
      createElement(SummaryCards, { summary })
    );
    expect(container.textContent).toContain("₫100,000");
    unmount();
  });

  test("formats expense amount as VND symbol", () => {
    const summary: Summary = { ...emptySummary, expense: 50000 };
    const { container, unmount } = renderComponent(
      createElement(SummaryCards, { summary })
    );
    expect(container.textContent).toContain("₫50,000");
    unmount();
  });

  test("renders category breakdown rows with name and percentage", () => {
    const summary: Summary = {
      income: 0,
      expense: 100000,
      balance: -100000,
      expense_by_category: [
        { category_id: 1, category_name: "Food", total: 60000 },
        { category_id: 2, category_name: "Transport", total: 40000 },
      ],
    };
    const { container, unmount } = renderComponent(
      createElement(SummaryCards, { summary })
    );
    expect(container.textContent).toContain("Food");
    expect(container.textContent).toContain("Transport");
    expect(container.textContent).toContain("60%");
    expect(container.textContent).toContain("40%");
    unmount();
  });

  test("shows 0% when total expense is 0", () => {
    const summary: Summary = {
      income: 0,
      expense: 0,
      balance: 0,
      expense_by_category: [
        { category_id: 1, category_name: "Food", total: 0 },
      ],
    };
    const { container, unmount } = renderComponent(
      createElement(SummaryCards, { summary })
    );
    expect(container.textContent).toContain("0%");
    unmount();
  });
});
