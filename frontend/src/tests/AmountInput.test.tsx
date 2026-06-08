import { test, expect, describe } from "bun:test";
import { act, createElement } from "react";
import { AmountInput } from "@/components/AmountInput";
import { renderComponent } from "./utils/render";

describe("AmountInput", () => {
  test("shows empty string when value is 0", () => {
    const { container, unmount } = renderComponent(
      createElement(AmountInput, { value: 0, onChange: () => {} })
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("");
    unmount();
  });

  test("shows formatted value with thousand separators", () => {
    const { container, unmount } = renderComponent(
      createElement(AmountInput, { value: 10000, onChange: () => {} })
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("10,000");
    unmount();
  });

  test("shows formatted value for large amounts", () => {
    const { container, unmount } = renderComponent(
      createElement(AmountInput, { value: 1234567, onChange: () => {} })
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("1,234,567");
    unmount();
  });

  test("fires onChange with parsed integer on input change", () => {
    let received = -1;
    const { container, unmount } = renderComponent(
      createElement(AmountInput, { value: 0, onChange: (v) => { received = v; } })
    );
    const input = container.querySelector("input") as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    act(() => {
      if (nativeSetter) nativeSetter.call(input, "50,000");
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    });
    // received should be parseVND("50,000") = 50000
    expect(received).toBe(50000);
    unmount();
  });

  test("has type=text and inputMode=numeric", () => {
    const { container, unmount } = renderComponent(
      createElement(AmountInput, { value: 0, onChange: () => {} })
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.type).toBe("text");
    expect(input.inputMode).toBe("numeric");
    unmount();
  });
});
