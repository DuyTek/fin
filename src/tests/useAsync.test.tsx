import { test, expect, describe, afterEach } from "bun:test";
import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useAsync } from "@/hooks/useAsync";

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

describe("useAsync", () => {
  test("starts in loading state", () => {
    const { result, unmount } = renderHook(() =>
      useAsync(null, () => new Promise(() => {}), [])
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    unmount();
  });

  test("resolves to data on success", async () => {
    const { result, unmount } = renderHook(() =>
      useAsync(0, () => Promise.resolve(42), [])
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
    unmount();
  });

  test("captures error message on failure", async () => {
    const { result, unmount } = renderHook(() =>
      useAsync(0, () => Promise.reject(new Error("boom")), [])
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("boom");
    unmount();
  });
});
