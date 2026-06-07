import { test, expect, describe, mock } from "bun:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { CategoryManager } from "@/components/CategoryManager";
import type { Category } from "@/types";

mock.module("@/lib/api", () => ({
  api: {
    createCategory: async (input: { name: string; type: string }) => ({
      id: 99,
      name: input.name,
      type: input.type,
      is_custom: 1,
      created_at: "2026-01-01",
    }),
    deleteCategory: async () => ({ ok: true }),
  },
}));

function renderComponent(element: ReturnType<typeof createElement>): {
  container: HTMLElement;
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(element); });
  return {
    container,
    unmount: () => {
      act(() => { root.unmount(); });
      container.remove();
    },
  };
}

const sampleCategories: Category[] = [
  { id: 1, name: "Food", type: "expense", is_custom: 0, created_at: "2026-01-01" },
  { id: 2, name: "Transport", type: "expense", is_custom: 1, created_at: "2026-01-01" },
  { id: 3, name: "Salary", type: "income", is_custom: 0, created_at: "2026-01-01" },
];

describe("CategoryManager", () => {
  test("renders expense categories by default", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryManager, { categories: sampleCategories, onChanged: () => {} })
    );
    expect(container.textContent).toContain("Food");
    expect(container.textContent).toContain("Transport");
    expect(container.textContent).not.toContain("Salary");
    unmount();
  });

  test("switches to income view on tab click", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryManager, { categories: sampleCategories, onChanged: () => {} })
    );
    const incomeBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.toLowerCase() === "income"
    ) as HTMLButtonElement;
    act(() => { incomeBtn.click(); });
    expect(container.textContent).toContain("Salary");
    expect(container.textContent).not.toContain("Food");
    unmount();
  });

  test("shows delete button only for custom categories", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryManager, { categories: sampleCategories, onChanged: () => {} })
    );
    const deleteButtons = container.querySelectorAll('[aria-label^="Delete"]');
    expect(deleteButtons.length).toBe(1);
    expect((deleteButtons[0] as HTMLElement).getAttribute("aria-label")).toBe("Delete Transport");
    unmount();
  });

  test("renders the add-category form", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryManager, { categories: sampleCategories, onChanged: () => {} })
    );
    const input = container.querySelector('input[name="name"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(container.textContent).toContain("Add");
    unmount();
  });
});
