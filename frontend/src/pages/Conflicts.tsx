import { useEffect, useState } from "react";
import { RecordPager } from "../RecordPager";
import { populationName } from "../labels";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Badge, PageHeading, State, useResource } from "../components";
import { CitationDialog } from "../CitationDialog";
import { useCitationAccess } from "../useCitationAccess";
import type { Answer, Citation, Source } from "../types";
function Comparison({
  query,
  onInspect,
  onDenied,
}: {
  query: Answer;
  onInspect: (c: Citation) => void;
  onDenied: (message: string) => void;
}) {
  const [sources, setSources] = useState<Source[] | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    setSources(null);
    setError("");
    Promise.all(
      query.citations.map((c) =>
        api<Source>(`/queries/${query.query_id}/citations/${c.id}`, {
          signal: abort.signal,
        }),
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
                  <Badge state="Conflict" />
                </div>
                <h3>{s.title}</h3>
                <blockquote>
                  {s.text.slice(s.start_char, s.end_char)}
                </blockquote>
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
  const items = resource.data?.items || [];
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(items.length / 6) - 1),
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
        record to compare its current sources.
      </p>
      {(access.error || comparisonError) && (
        <p role="alert" className="form-error">
          {access.error || comparisonError}
        </p>
      )}
      <State error={resource.error} loading={resource.loading}>
        {resource.data?.items.length ? (
          <div className="history-list">
            {items.slice(currentPage * 6, (currentPage + 1) * 6).map((q) => (
              <article className="panel conflict-record" key={q.query_id}>
                <div className="section-heading">
                  <h2>{q.citations[0]?.title || "Policy disagreement"}</h2>
                  <Badge state="Conflict" />
                </div>
                <p className="section-note">
                  As of {q.as_of} · {populationName(q.scope.population)} ·{" "}
                  {q.citations.length} competing sources
                </p>
                {q.created_at && (
                  <time className="record-date" dateTime={q.created_at}>
                    Recorded{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(new Date(q.created_at))}{" "}
                    UTC
                  </time>
                )}
                <button
                  className="button"
                  aria-expanded={open === q.query_id}
                  onClick={() => {
                    setComparisonError("");
                    setOpen(open === q.query_id ? null : q.query_id);
                  }}
                >
                  {open === q.query_id
                    ? "Close comparison"
                    : "Compare policy evidence"}
                </button>
                {open === q.query_id && (
                  <div>
                    <p className="conflict-abstention">{q.answer}</p>
                    <Comparison
                      query={q}
                      onInspect={(c) => void access.inspect(q, c)}
                      onDenied={(message) => {
                        setComparisonError(message);
                        setOpen(null);
                        resource.reload();
                      }}
                    />
                  </div>
                )}
              </article>
            ))}
            <RecordPager
              page={currentPage}
              total={items.length}
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
