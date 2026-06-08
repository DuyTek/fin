import { test, expect, describe } from "bun:test";
import { act, createElement } from "react";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import type { Category } from "@/types";
import { renderComponent } from "./utils/render";

const categories: Category[] = [
  { id: 1, name: "Food", type: "expense", is_custom: 0, created_at: "2026-01-01" },
  { id: 2, name: "Transport", type: "expense", is_custom: 1, created_at: "2026-01-01" },
  { id: 3, name: "Salary", type: "income", is_custom: 0, created_at: "2026-01-01" },
];

describe("CategoryCombobox", () => {
  test("shows placeholder when no value selected", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryCombobox, {
        categories,
        type: "expense",
        value: "",
        onChange: () => {},
        onCategoryCreated: () => {},
      })
    );
    expect(container.textContent).toContain("Search or create a category");
    unmount();
  });

  test("shows selected category name when value is set", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryCombobox, {
        categories,
        type: "expense",
        value: "1",
        onChange: () => {},
        onCategoryCreated: () => {},
      })
    );
    expect(container.textContent).toContain("Food");
    unmount();
  });

  test("opens dropdown when trigger is clicked", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryCombobox, {
        categories,
        type: "expense",
        value: "",
        onChange: () => {},
        onCategoryCreated: () => {},
      })
    );
    const trigger = container.querySelector("button") as HTMLButtonElement;
    act(() => { trigger.click(); });
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    unmount();
  });

  test("shows only categories of the given type in dropdown", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryCombobox, {
        categories,
        type: "expense",
        value: "",
        onChange: () => {},
        onCategoryCreated: () => {},
      })
    );
    const trigger = container.querySelector("button") as HTMLButtonElement;
    act(() => { trigger.click(); });
    const listbox = container.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox.textContent).toContain("Food");
    expect(listbox.textContent).toContain("Transport");
    expect(listbox.textContent).not.toContain("Salary");
    unmount();
  });

  test("selecting an option calls onChange with the category id", () => {
    let selected = "";
    const { container, unmount } = renderComponent(
      createElement(CategoryCombobox, {
        categories,
        type: "expense",
        value: "",
        onChange: (id) => { selected = id; },
        onCategoryCreated: () => {},
      })
    );
    const trigger = container.querySelector("button") as HTMLButtonElement;
    act(() => { trigger.click(); });
    const options = container.querySelectorAll('[role="option"] button[type="button"]');
    act(() => { (options[0] as HTMLButtonElement).click(); });
    expect(selected).toBe("1");
    unmount();
  });

  test("shows 'Create ...' option when query has no exact match", () => {
    const { container, unmount } = renderComponent(
      createElement(CategoryCombobox, {
        categories,
        type: "expense",
        value: "",
        onChange: () => {},
        onCategoryCreated: () => {},
      })
    );
    const trigger = container.querySelector("button") as HTMLButtonElement;
    act(() => { trigger.click(); });
    const searchInput = container.querySelector('input[placeholder="Search categories…"]') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    act(() => {
      if (nativeSetter) nativeSetter.call(searchInput, "NewCat");
      searchInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "NewCat" }));
    });
    expect(container.textContent).toContain('Create "NewCat"');
    unmount();
  });

  test("shows 'No categories found' when no categories exist for the selected type", () => {
    // No income categories → filtered is empty, canCreate is false (query is empty) → shows message
    const { container, unmount } = renderComponent(
      createElement(CategoryCombobox, {
        categories: [{ id: 1, name: "Food", type: "expense", is_custom: 0, created_at: "2026-01-01" }],
        type: "income",
        value: "",
        onChange: () => {},
        onCategoryCreated: () => {},
      })
    );
    const trigger = container.querySelector("button") as HTMLButtonElement;
    act(() => { trigger.click(); });
    expect(container.textContent).toContain("No categories found");
    unmount();
  });
});
