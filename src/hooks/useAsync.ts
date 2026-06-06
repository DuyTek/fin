/**
 * Generic async-data hook: runs `fetcher` on mount and whenever `deps` change,
 * tracking loading/error/data and exposing a manual `reload`. Stale responses
 * are dropped when deps change or the component unmounts.
 *
 * Not finance-specific — reuse it for any read-from-API view.
 */
import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsync<T>(
  initial: T,
  fetcher: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetcher()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => alive && setError(String(e?.message ?? e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // `fetcher` is derived from `deps`; deps + tick are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload };
}
