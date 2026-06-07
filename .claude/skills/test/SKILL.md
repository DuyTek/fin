---
name: test
description: Write, run, and check tests for this project using bun:test. Use when asked to add tests, write a test file, verify coverage, or test a function/hook/component.
---

# Writing Tests

Tests live in `src/tests/`. All new test files go there — not colocated with source.

## Run tests

```bash
bun test                    # all tests
bun test src/tests/foo.test.ts   # one file
bun test --coverage         # with coverage report
```

## Quality gate

All must pass before merging:

```bash
bun run lint    # eslint src
bun run build   # production build
bun test        # all tests pass
bun test --coverage   # verify >= 80% lines covered (check the table manually)
```

## File naming

| Source file | Test file |
|---|---|
| `src/lib/money.ts` | `src/tests/money.test.ts` |
| `src/hooks/useAsync.ts` | `src/tests/useAsync.test.tsx` |
| `src/components/Foo.tsx` | `src/tests/Foo.test.tsx` |

Use `.tsx` for any file that renders JSX or imports React.

## Code hierarchy

```
// 1. Imports
import { test, expect, describe } from "bun:test";

// 2. Mocks and file-scoped constants (mock() calls before describe)

// 3. Describe block named after the source file
describe("source-file-name", () => {
  // 4. Pre-run setup (beforeEach, afterEach, afterAll)

  // 5. Test cases
  test("description of what it does", () => { ... });
});
```

Only test possible, reproducible cases — no tests for invariants the type system or DB already enforce.

---

## Pure function tests (no setup needed)

No imports beyond `bun:test` and the module under test. See [src/tests/money.test.ts](../../src/tests/money.test.ts) for the full example.

```ts
import { test, expect, describe } from "bun:test";
import { shiftMonth, monthRange } from "@/lib/dates";

describe("dates", () => {
  test("shiftMonth advances by delta", () => {
    expect(shiftMonth("2026-01", 1)).toBe("2026-02");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  test("monthRange returns correct bounds", () => {
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
});
```

---

## React hook tests (DOM environment required)

The `src/tests/setup.ts` preload configures happy-dom and `IS_REACT_ACT_ENVIRONMENT`.
It runs automatically via `bunfig.toml`'s `[test] preload` — no manual import needed.

Use this `renderHook` pattern (copy it into your test file):

```tsx
import { test, expect, describe } from "bun:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { useYourHook } from "@/hooks/useYourHook";

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

describe("useYourHook", () => {
  test("initial state", () => {
    const { result, unmount } = renderHook(() => useYourHook());
    expect(result.current.value).toBe(/* expected initial */);
    unmount();
  });

  test("async resolution", async () => {
    const { result, unmount } = renderHook(() => useYourHook());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.data).toBe(/* expected */);
    unmount();
  });
});
```

See [src/tests/useAsync.test.tsx](../../src/tests/useAsync.test.tsx) for a complete working example.

Always call `unmount()` at the end of each test to avoid DOM leaks between tests.

---

## Mocking

Use `mock()` from `bun:test` for external dependencies (e.g. `fetch`, `lib/api.ts`):

```ts
import { test, expect, describe, mock } from "bun:test";

mock.module("@/lib/api", () => ({
  fetchCategories: async () => [{ id: 1, name: "Food", type: "expense" }],
}));
```

Place `mock.module()` calls at file scope, before `describe`.

---

## Setup files

| File | Purpose |
|---|---|
| `src/tests/setup.ts` | Auto-preloaded by bun. Registers happy-dom globals + React act environment. |

`bunfig.toml` wires it:
```toml
[test]
preload = ["./src/tests/setup.ts"]
```

Do not add more preload files unless strictly necessary — side-effectful setup is hard to debug.
