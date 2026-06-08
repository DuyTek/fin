import { test, expect, describe } from "bun:test";
import { act } from "react";
import { useAsync } from "@/hooks/useAsync";
import { renderHook } from "./utils/render";

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
