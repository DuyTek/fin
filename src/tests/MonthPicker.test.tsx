import { test, expect, describe } from "bun:test";
import { act, createElement } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { renderComponent } from "./utils/render";

describe("MonthPicker", () => {
  test("displays the formatted month label", () => {
    const { container, unmount } = renderComponent(
      createElement(MonthPicker, { month: "2026-06", onChange: () => {} })
    );
    expect(container.textContent).toContain("June 2026");
    unmount();
  });

  test("previous button calls onChange with prior month", () => {
    let result = "";
    const { container, unmount } = renderComponent(
      createElement(MonthPicker, { month: "2026-06", onChange: (m) => { result = m; } })
    );
    const prevBtn = container.querySelector('[aria-label="Previous month"]') as HTMLButtonElement;
    act(() => { prevBtn.click(); });
    expect(result).toBe("2026-05");
    unmount();
  });

  test("next button calls onChange with following month", () => {
    let result = "";
    const { container, unmount } = renderComponent(
      createElement(MonthPicker, { month: "2026-06", onChange: (m) => { result = m; } })
    );
    const nextBtn = container.querySelector('[aria-label="Next month"]') as HTMLButtonElement;
    act(() => { nextBtn.click(); });
    expect(result).toBe("2026-07");
    unmount();
  });

  test("wraps December to January on next", () => {
    let result = "";
    const { container, unmount } = renderComponent(
      createElement(MonthPicker, { month: "2026-12", onChange: (m) => { result = m; } })
    );
    const nextBtn = container.querySelector('[aria-label="Next month"]') as HTMLButtonElement;
    act(() => { nextBtn.click(); });
    expect(result).toBe("2027-01");
    unmount();
  });

  test("wraps January to December on previous", () => {
    let result = "";
    const { container, unmount } = renderComponent(
      createElement(MonthPicker, { month: "2026-01", onChange: (m) => { result = m; } })
    );
    const prevBtn = container.querySelector('[aria-label="Previous month"]') as HTMLButtonElement;
    act(() => { prevBtn.click(); });
    expect(result).toBe("2025-12");
    unmount();
  });
});
