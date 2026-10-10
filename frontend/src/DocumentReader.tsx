import { useEffect, useMemo, useRef, useState } from "react";
import { readingPages, type TextRange } from "./sourceText";
import { MarkedText } from "./SourceMarkup";

export default function DocumentReader({
  text,
  title,
  evidence,
  locator,
}: {
  text: string;
  title: string;
  evidence?: TextRange;
  locator?: string;
}) {
  const pages = useMemo(() => readingPages(text), [text]);
  const evidencePage = pages.findIndex((p) =>
    p.some((b) => evidence && b.start < evidence.end && b.end > evidence.start),
  );
  const [page, setPage] = useState(Math.max(0, evidencePage)),
    [find, setFind] = useState(""),
    [match, setMatch] = useState(0);
  const paper = useRef<HTMLElement>(null);
  const matches = useMemo(() => {
    if (!find) return [];
    const result: TextRange[] = [];
    let at = text.indexOf(find);
    let previous = 0,
      point = 0;
    const length = Array.from(find).length;
    while (at >= 0 && result.length < 1000) {
      point += Array.from(text.slice(previous, at)).length;
      result.push({ start: point, end: point + length });
      point += length;
      previous = at + find.length;
      at = text.indexOf(find, at + find.length);
    }
    return result;
  }, [text, find]);
  useEffect(() => {
    const target =
      paper.current?.querySelector<HTMLElement>(
        'mark[data-highlight="evidence"]',
      ) ||
      paper.current?.querySelector<HTMLElement>('mark[data-highlight="match"]');
    target?.scrollIntoView?.({ block: "center", behavior: "instant" });
  }, [page, find, match]);
  function go(next: number) {
    setPage(next);
    requestAnimationFrame(() => {
      paper.current?.focus({ preventScroll: true });
      paper.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  function moveMatch(next: number) {
    setMatch(next);
    const hit = matches[next];
    if (hit)
      setPage(
        Math.max(
          0,
          pages.findIndex((p) =>
            p.some((b) => b.start < hit.end && b.end > hit.start),
          ),
        ),
      );
  }
  function supportingPassage() {
    setPage(Math.max(0, evidencePage));
    requestAnimationFrame(() => {
      const hit = paper.current?.querySelector<HTMLElement>(
        'mark[data-highlight="evidence"]',
      );
      hit?.focus({ preventScroll: true });
      hit?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }
  const sections = pages
    .flatMap((p, i) =>
      p
        .filter((b) => b.heading)
        .map((b) => ({ label: b.text.trim(), page: i, start: b.start })),
    )
    .slice(0, 200);
  return (
    <div className="document-reader">
      <div className="reader-tools">
        <div>
          <strong>Document reader</strong>
          <p className="section-note">
            Reflowed extracted text. Reading pages are not original file page
            numbers.
          </p>
        </div>
        <nav aria-label="Reading pages">
          <button
            className="button"
            disabled={page === 0}
            onClick={() => go(page - 1)}
          >
            Previous page
          </button>
          <label>
            Reading page
            <select
              aria-label="Reading page"
              value={page}
              onChange={(e) => go(Number(e.target.value))}
            >
              {pages.map((_, i) => (
                <option key={i} value={i}>
                  {i + 1} of {pages.length}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button"
            disabled={page === pages.length - 1}
            onClick={() => go(page + 1)}
          >
            Next page
          </button>
        </nav>
        {sections.length > 0 && (
          <label>
            Section
            <select
              aria-label="Document section"
              value=""
              onChange={(e) => {
                if (e.target.value) go(Number(e.target.value));
              }}
            >
              <option value="">Jump to a section</option>
              {sections.map((s) => (
                <option key={s.start} value={s.page}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="reader-find">
          <label>
            Find exact text
            <input
              type="search"
              name="source-search"
              autoComplete="off"
              value={find}
              onChange={(e) => {
                setFind(e.target.value);
                setMatch(0);
              }}
            />
          </label>
          {find && (
            <>
              <span role="status">
                {matches.length
                  ? `${match + 1} of ${matches.length}${matches.length === 1000 ? " (first 1000)" : ""}`
                  : "No matches"}
              </span>
              <button
                className="button"
                disabled={!matches.length || match === 0}
                onClick={() => moveMatch(match - 1)}
              >
                Previous match
              </button>
              <button
                className="button"
                disabled={!matches.length || match === matches.length - 1}
                onClick={() => moveMatch(match + 1)}
              >
                Next match
              </button>
              <button
                className="button"
                disabled={!matches.length}
                onClick={() => moveMatch(match)}
              >
                Go to match
              </button>
            </>
          )}
          {evidence && (
            <button className="button" onClick={supportingPassage}>
              Supporting passage
            </button>
          )}
        </div>
      </div>
      {evidence && (
        <p className="reader-evidence-note">
          Highlighted evidence · {locator} · source characters {evidence.start}–
          {evidence.end}
        </p>
      )}
      <article
        className="reader-paper"
        ref={paper}
        tabIndex={-1}
        aria-label={`${title}, reading page ${page + 1}`}
      >
        <header className="reader-running-head">
          <span>{title}</span>
          <span>
            Reading page {page + 1} / {pages.length}
          </span>
        </header>
        <div className="reader-body">
          {pages[page].map((b, i) => {
            const value = (
              <MarkedText
                text={b.text}
                offset={b.start}
                evidence={evidence}
                matches={matches[match] ? [matches[match]] : []}
              />
            );
            return b.heading || (page === 0 && i === 0) ? (
              <h3
                key={b.start}
                className={
                  page === 0 && i === 0 ? "reader-document-title" : undefined
                }
              >
                {value}
              </h3>
            ) : (
              <p className={b.table ? "reader-table-row" : ""} key={b.start}>
                {value}
              </p>
            );
          })}
        </div>
      </article>
      <p className="reader-end" role="status">
        Reading page {page + 1} of {pages.length}. Only this reading page is
        rendered.
      </p>
    </div>
  );
}
