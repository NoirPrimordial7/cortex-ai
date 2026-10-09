import { populationName } from "../labels";
import { Link } from "react-router-dom";
import { Badge, PageHeading, State, useResource } from "../components";
import { PolicySource } from "../SourceInspector";
import { CitationDialog } from "../CitationDialog";
import { useCitationAccess } from "../useCitationAccess";
import type { Answer } from "../types";
export default function History() {
  const resource = useResource<{ items: Answer[] }>("/queries");
  const access = useCitationAccess(resource.reload);
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
      {access.error && (
        <p role="alert" className="form-error">
          {access.error}
        </p>
      )}
      <State loading={resource.loading} error={resource.error}>
        {resource.data?.items.length ? (
          <section className="history-list">
            {resource.data.items.map((q) => (
              <details className="history-record" key={q.query_id}>
                <summary>
                  <div>
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
