/**
 * Generic async-data hook: runs `fetcher` on mount and whenever `deps` change,
 * tracking loading/error/data and exposing a manual `reload`. Stale responses
 * are dropped when deps change or the component unmounts.
 *
 * Not finance-specific — reuse it for any read-from-API view.
 */
import { useEffect, useReducer } from "react";

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

type State<T> = Omit<AsyncState<T>, "reload">;
type Action<T> =
  | { type: "fetch" }
  | { type: "success"; data: T }
  | { type: "error"; message: string };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "fetch":
      return { ...state, loading: true, error: null };
    case "success":
      return { data: action.data, loading: false, error: null };
    case "error":
      return { ...state, loading: false, error: action.message };
  }
}

export function useAsync<T>(
  initial: T,
  fetcher: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: initial,
    loading: true,
    error: null,
  });
  const [tick, reload] = useReducer((t: number) => t + 1, 0);

  useEffect(() => {
    let alive = true;
    dispatch({ type: "fetch" });
    fetcher()
      .then((d) => {
        if (!alive) return;
        dispatch({ type: "success", data: d });
      })
      .catch((e) => {
        if (!alive) return;
        dispatch({ type: "error", message: String(e?.message ?? e) });
      });
    return () => {
      alive = false;
    };
    // `fetcher` is derived from `deps`; deps + tick are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload };
}
