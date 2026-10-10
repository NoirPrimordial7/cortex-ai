import { populationName } from "../labels";
import { useState } from "react";
import { RecordPager } from "../RecordPager";
import { Link } from "react-router-dom";
import { Badge, PageHeading, State, useResource } from "../components";
import { PolicySource } from "../SourceInspector";
import { CitationDialog } from "../CitationDialog";
import { useCitationAccess } from "../useCitationAccess";
import type { Answer } from "../types";
export default function History() {
  const resource = useResource<{ items: Answer[] }>("/queries");
  const access = useCitationAccess(resource.reload);
  const [status, setStatus] = useState("all"),
    [page, setPage] = useState(0);
  const items =
    resource.data?.items.filter(
      (q) =>
        status === "all" ||
        (status === "conflict"
          ? q.reason_code === "UNRESOLVED_CONFLICT"
          : q.status === status),
    ) || [];
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(items.length / 10) - 1),
  );
  return (
    <>
      <PageHeading
        eyebrow="Evidence record"
        title="Answer history"
        description="Your saved answers, with current permissions and evidence revisions checked on every read."
        action={
          <Link className="button" to="/assistant">
            Ask another question
          </Link>
        }
      />
      <div className="record-toolbar">
        <p className="section-note">
          Your latest 30 permitted requests. Open an answer to verify its
          current sources.
        </p>
        <label>
          Answer status
          <select
            name="answer-status"
            aria-label="Answer status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All answers</option>
            <option value="answered">Evidence answers</option>
            <option value="conflict">Conflicts</option>
            <option value="clarification_required">More context needed</option>
            <option value="abstained">Abstained</option>
          </select>
        </label>
      </div>
      {access.error && (
        <p role="alert" className="form-error">
          {access.error}
        </p>
      )}
      <State loading={resource.loading} error={resource.error}>
        {resource.data?.items.length ? (
          <section className="history-list">
            {items.slice(currentPage * 10, (currentPage + 1) * 10).map((q) => (
              <details className="history-record" key={q.query_id}>
                <summary>
                  <div>
                    {q.created_at && (
                      <time className="record-date" dateTime={q.created_at}>
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "UTC",
                        }).format(new Date(q.created_at))}{" "}
                        UTC
                      </time>
                    )}
                    <Badge
                      state={
                        q.reason_code === "UNRESOLVED_CONFLICT"
                          ? "Conflict"
                          : q.status === "answered"
                            ? "Evidence answer"
                            : q.status === "clarification_required"
                              ? "More context needed"
                              : "Abstained"
                      }
                    />
                    <strong>{q.answer}</strong>
                    <span>
                      As of {q.as_of} · {populationName(q.scope.population)} ·{" "}
                      {q.citations.length}{" "}
                      {q.citations.length === 1 ? "source" : "sources"}
                    </span>
                  </div>
                </summary>
                <div className="history-expanded">
                  <p>{q.answer}</p>
                  {q.citations.length > 0 && (
                    <p className="section-note">
                      Open a source to verify its passage under your current
                      access.
                    </p>
                  )}
                  <div className="fb-citations">
                    {q.citations.map((c, i) => (
                      <PolicySource
                        key={c.id}
                        citation={c}
                        index={i}
                        onInspect={() => void access.inspect(q, c)}
                      />
                    ))}
                  </div>
                </div>
              </details>
            ))}
            {!items.length && (
              <p className="empty-note">No answers match this status.</p>
            )}
            <RecordPager
              page={currentPage}
              total={items.length}
              size={10}
              onPage={setPage}
            />
          </section>
        ) : (
          <div className="empty-state">
            <h2>Your evidence record starts here</h2>
            <p>
              Ask a policy question to save its answer and permitted citations.
            </p>
          </div>
        )}
      </State>
      <CitationDialog access={access} />
    </>
  );
}
