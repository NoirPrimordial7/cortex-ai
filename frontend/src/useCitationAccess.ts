import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Answer, Citation, Source } from "./types";
/** Never display a stored quotation without a fresh authorized source read. */
export function useCitationAccess(onDenied?: () => void) {
  const [context, setContext] = useState<
    { date: string; population: string } | undefined
  >();
  const epoch = useRef(0),
    denied = useRef(onDenied);
  denied.current = onDenied;
  const [source, setSource] = useState<Source | null>(null),
    [citation, setCitation] = useState<Citation | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false);
  function close() {
    setContext(undefined);
    epoch.current++;
    setSource(null);
    setCitation(null);
    setBusy(false);
  }
  useEffect(() => {
    const clear = () => {
      close();
      setError("");
    };
    window.addEventListener("cortex:evidence-changed", clear);
    return () => {
      epoch.current++;
      window.removeEventListener("cortex:evidence-changed", clear);
    };
  }, []);
  async function inspect(q: Answer, c: Citation) {
    const stamp = ++epoch.current;
    setSource(null);
    setCitation(c);
    setBusy(true);
    setError("");
    setConflict(q.reason_code === "UNRESOLVED_CONFLICT");
    setContext({ date: q.as_of, population: q.scope.population });
    try {
      const fresh = await api<Source>(
        `/queries/${q.query_id}/citations/${c.id}`,
      );
      if (epoch.current === stamp) setSource(fresh);
    } catch (e) {
      if (epoch.current === stamp) {
        close();
        setError((e as Error).message);
        denied.current?.();
      }
    } finally {
      if (epoch.current === stamp) setBusy(false);
    }
  }
  return { source, citation, busy, error, conflict, context, inspect, close };
}
