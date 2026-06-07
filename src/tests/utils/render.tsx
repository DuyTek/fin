import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

export function renderComponent(element: ReturnType<typeof createElement>): {
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

export function renderHook<T>(render: () => T): { result: { current: T }; unmount: () => void } {
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
