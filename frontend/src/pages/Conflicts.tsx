import { useEffect, useState } from "react";
import { RecordPager } from "../RecordPager";
import { populationName } from "../labels";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Badge, PageHeading, State, useResource } from "../components";
import { CitationDialog } from "../CitationDialog";
import { useCitationAccess } from "../useCitationAccess";
import type { Answer, Citation, Source } from "../types";
import { groupConflicts } from "../conflictGroups";
import { sourceSlice } from "../sourceText";
function Comparison({
  query,
  onInspect,
  onDenied,
  onClose,
}: {
  query: Answer;
  onInspect: (c: Citation) => void;
  onDenied: (message: string) => void;
  onClose: () => void;
}) {
  const [sources, setSources] = useState<Source[] | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setSources(null);
    setError("");
    Promise.all(
      query.citations.map((c) =>
        api<Source>(
          `/queries/${query.query_id}/citations/${c.id}?view=passage`,
          {
            signal: abort.signal,
          },
        ),
      ),
    )
      .then((items) => {
        if (!abort.signal.aborted) setSources(items);
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          setSources(null);
          setError(e.message);
          onDenied(e.message);
        }
      });
    return () => abort.abort();
  }, [query.query_id]);
  return (
    <State loading={!sources && !error} error={error}>
      {sources && (
        <div>
          <nav className="comparison-jumps" aria-label="Comparison sources">
            {sources.map((s, i) => (
              <a
                key={s.id}
                href={`#conflict-source-${s.id}`}
                onClick={() =>
                  document.getElementById(`conflict-source-${s.id}`)?.focus()
                }
              >
                Jump to source {i + 1}
              </a>
            ))}
            <button className="button back-link" onClick={onClose}>
              Return to list
            </button>
            <Link to="/assistant">Ask a follow-up</Link>
          </nav>
          <div className="conflict-comparison">
            {sources.map((s, i) => (
              <section
                className="conflict-evidence"
                key={s.id}
                id={`conflict-source-${s.id}`}
                tabIndex={-1}
              >
                <div className="section-heading">
                  <span className="source-number">Source {i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <blockquote>
                  {sourceSlice(
                    s.text,
                    s.start_char - (s.text_start_char || 0),
                    s.end_char - (s.text_start_char || 0),
                  )}
                </blockquote>
                <p className="section-note">{s.locator}</p>
                <details className="comparison-metadata">
                  <summary>Validity & authority</summary>
                  <dl>
                    <div>
                      <dt>Passage</dt>
                      <dd>{s.locator}</dd>
                    </div>
                    <div>
                      <dt>Validity</dt>
                      <dd>
                        {s.valid_from} → {s.valid_to || "open-ended"}
                        {s.valid_to ? " (end exclusive)" : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>Authority</dt>
                      <dd>
                        {s.source_kind.replaceAll("_", " ")}
                        {s.authority_rank !== undefined
                          ? ` · rank ${s.authority_rank}`
                          : ""}
                      </dd>
                    </div>
                  </dl>
                </details>
                <button className="button" onClick={() => onInspect(s)}>
                  Inspect source context
                </button>
              </section>
            ))}
          </div>
        </div>
      )}
    </State>
  );
}
export default function Conflicts() {
  const resource = useResource<{ items: Answer[] }>("/conflicts");
  const access = useCitationAccess(resource.reload);
  const [open, setOpen] = useState<string | null>(null);
  const [comparisonError, setComparisonError] = useState("");
  const [page, setPage] = useState(0);
  const [occurrence, setOccurrence] = useState<string | null>(null);
  const items = resource.data?.items || [];
  const groups = groupConflicts(items);
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(groups.length / 6) - 1),
  );
  useEffect(() => {
    const clear = () => setOpen(null);
    window.addEventListener("cortex:evidence-changed", clear);
    return () => window.removeEventListener("cortex:evidence-changed", clear);
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="Evidence disagreements"
        title="Conflicts & validity"
        description="When equally authoritative, simultaneously effective policies disagree, Cortex abstains. Compare the permitted evidence before deciding."
        action={
          <Link className="button" to="/assistant">
            Ask Cortex
          </Link>
        }
      />
      <p className="section-note">
        Unresolved conflicts within your latest 30 permitted requests. Expand a
        group to compare its current sources. Every occurrence remains
        available.
      </p>
      {(access.error || comparisonError) && (
        <p role="alert" className="form-error">
          {access.error || comparisonError}
        </p>
      )}
      <State error={resource.error} loading={resource.loading}>
        {resource.data?.items.length ? (
          <div className="history-list">
            {groups
              .slice(currentPage * 6, (currentPage + 1) * 6)
              .map((group) => {
                const q =
                  group.occurrences.find((q) => q.query_id === occurrence) ||
                  group.occurrences[0];
                const expanded = open === group.key;
                const close = () => {
                  setOpen(null);
                  requestAnimationFrame(() =>
                    document
                      .getElementById(
                        `compare-${group.occurrences[0].query_id}`,
                      )
                      ?.focus(),
                  );
                };
                return (
                  <article className="panel conflict-record" key={group.key}>
                    <div className="section-heading">
                      <h2>
                        {expanded
                          ? "Compare policy evidence"
                          : q.citations.map((c) => c.title).join(" / ") ||
                            "Policy disagreement"}
                      </h2>
                      <Badge state="Conflict" />
                    </div>
                    <p className="section-note">
                      As of {q.as_of} · {populationName(q.scope.population)} ·{" "}
                      {q.citations.length} competing sources
                    </p>
                    <p className="record-date">
                      {group.occurrences.length}{" "}
                      {group.occurrences.length === 1
                        ? "occurrence"
                        : "occurrences"}
                      {group.occurrences[0].created_at && (
                        <>
                          {" "}
                          · Last seen{" "}
                          <time dateTime={group.occurrences[0].created_at}>
                            {new Intl.DateTimeFormat("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "UTC",
                            }).format(
                              new Date(group.occurrences[0].created_at!),
                            )}{" "}
                            UTC
                          </time>
                        </>
                      )}
                    </p>
                    <button
                      className="button"
                      id={`compare-${group.occurrences[0].query_id}`}
                      aria-expanded={expanded}
                      onClick={() => {
                        setComparisonError("");
                        setOccurrence(null);
                        setOpen(expanded ? null : group.key);
                      }}
                    >
                      {expanded
                        ? "Close comparison"
                        : "Compare policy evidence"}
                    </button>
                    {expanded && (
                      <div>
                        <p className="conflict-abstention">{q.answer}</p>
                        <Comparison
                          query={q}
                          key={q.query_id}
                          onClose={close}
                          onInspect={(c) => void access.inspect(q, c)}
                          onDenied={(message) => {
                            setComparisonError(message);
                            setOpen(null);
                            resource.reload();
                          }}
                        />
                      </div>
                    )}
                    <details className="conflict-occurrences">
                      <summary>
                        Recorded occurrences ({group.occurrences.length})
                      </summary>
                      <ol>
                        {group.occurrences.map((record) => (
                          <li key={record.query_id}>
                            <time dateTime={record.created_at}>
                              {record.created_at || "Timestamp unavailable"}
                            </time>
                            <code>{record.query_id}</code>
                            <button
                              className="button"
                              onClick={() => {
                                setOccurrence(record.query_id);
                                setOpen(group.key);
                                setComparisonError("");
                              }}
                            >
                              Inspect this occurrence
                            </button>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </article>
                );
              })}
            <RecordPager
              page={currentPage}
              total={groups.length}
              noun="conflict groups"
              size={6}
              onPage={(p) => {
                setOpen(null);
                setPage(p);
              }}
            />
          </div>
        ) : (
          <div className="empty-state">
            <h2>No readable conflicts in your history</h2>
            <p>
              Conflicting evidence appears here when a policy question produces
              an unresolved disagreement.
            </p>
          </div>
        )}
      </State>
      <CitationDialog access={access} returnLabel="Back to conflicts" />
    </>
  );
}
