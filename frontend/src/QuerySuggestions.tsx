import { useEffect, useState, type KeyboardEvent } from "react";
import { api } from "./api";

export const suggestionsId = "question-suggestions";

export function useQuerySuggestions(
  query: string,
  date: string,
  population: string,
) {
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const [results, setResults] = useState<{ key: string; items: string[] }>();
  const partial = query.trim().slice(0, 160);
  const key = new URLSearchParams({
    q: partial,
    as_of: date,
    population,
  }).toString();
  useEffect(() => {
    if (!partial || !date || !focused || dismissed) return;
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      api<{ items: string[] }>(`/queries/suggestions?${key}`, {
        signal: abort.signal,
      })
        .then((result) => {
          if (!abort.signal.aborted)
            setResults({ key, items: result?.items ?? [] });
        })
        .catch(() => {
          if (!abort.signal.aborted) setResults(undefined);
        });
    }, 200);
    return () => {
      window.clearTimeout(timer);
      abort.abort();
    };
  }, [key, partial, date, focused, dismissed]);
  useEffect(() => {
    const clear = () => {
      setResults(undefined);
      setDismissed(true);
      setActive(-1);
    };
    window.addEventListener("cortex:evidence-changed", clear);
    return () => window.removeEventListener("cortex:evidence-changed", clear);
  }, []);
  const items =
    focused && !dismissed && results?.key === key ? results.items : [];
  const selected = active >= 0 && active < items.length ? active : -1;
  useEffect(() => {
    if (
      selected >= 0 &&
      typeof document.getElementById(`${suggestionsId}-${selected}`)
        ?.scrollIntoView === "function"
    )
      document
        .getElementById(`${suggestionsId}-${selected}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  function onInput() {
    setDismissed(false);
    setActive(-1);
  }
  function choose(value: string, setQuery: (value: string) => void) {
    setQuery(value);
    setDismissed(true);
    setActive(-1);
  }
  function onKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    setQuery: (value: string) => void,
  ) {
    if (event.nativeEvent.isComposing || !items.length) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setDismissed(true);
      setActive(-1);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive(
        selected === -1
          ? direction === 1
            ? 0
            : items.length - 1
          : (selected + direction + items.length) % items.length,
      );
    } else if (event.key === "Enter" && selected >= 0) {
      event.preventDefault();
      choose(items[selected], setQuery);
    }
  }
  return { items, selected, setFocused, onInput, onKeyDown, choose };
}
