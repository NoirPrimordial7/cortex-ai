import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, PageHeading, State, useResource } from "../components";
import { useWorkflowActions, WorkflowPanel } from "../WorkflowActions";
import { RecordPager } from "../RecordPager";
import type { PolicyTicket } from "../types";

export default function PolicyTickets() {
  const resource = useResource<{ items: PolicyTicket[] }>("/policy-tickets");
  const [selected, setSelected] = useState(""),
    [filter, setFilter] = useState("pending"),
    [page, setPage] = useState(0);
  const records = (resource.data?.items || []).filter((t) =>
    filter === "history"
      ? !t.from_cortex
      : Boolean(t.from_cortex) && t.status === filter,
  );
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(records.length / 10) - 1),
  );
  return (
    <>
      <PageHeading
        eyebrow="Governance"
        title="Conflict re-audits"
        description="Review the exact policy versions sent from an Ask Cortex conflict. Select its primary policy, or undo a previous choice to restore the disagreement."
      />
      <WorkflowPanel title="Review queue">
        <label>
          Review status
          <select
            aria-label="Review status"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
              setSelected("");
            }}
          >
            <option value="pending">Pending conflicts</option>
            <option value="resolved">Resolved conflicts</option>
            <option value="history">Historical manual tickets</option>
          </select>
        </label>
        <State error={resource.error} loading={resource.loading}>
          {records.length ? (
            records.slice(current * 10, (current + 1) * 10).map((t) => (
              <div className="collection-row" key={t.id}>
                <div>
                  <Badge state={t.status} />
                  <p>{t.description}</p>
                  <p className="section-note">Sent by {t.display_name}</p>
                </div>
                <button className="button" onClick={() => setSelected(t.id)}>
                  Open conflict
                </button>
              </div>
            ))
          ) : (
            <p className="empty-note">
              No{" "}
              {filter === "history"
                ? "historical manual tickets"
                : filter + " conflicts"}{" "}
              to show.
            </p>
          )}
          <RecordPager
            page={current}
            total={records.length}
            size={10}
            onPage={setPage}
          />
        </State>
      </WorkflowPanel>
      {selected && (
        <ConflictDetail
          key={selected}
          id={selected}
          onClose={() => setSelected("")}
          onChange={resource.reload}
        />
      )}
    </>
  );
}

function ConflictDetail({
  id,
  onClose,
  onChange,
}: {
  id: string;
  onClose: () => void;
  onChange: () => void;
}) {
  const resource = useResource<PolicyTicket>("/policy-tickets/" + id);
  const actions = useWorkflowActions(() => {
    resource.reload();
    onChange();
  });
  const t = resource.data;
  const sources = t?.conflict_sources || [];
  const canResolve =
    sources.length >= 2 && sources.every((s) => s.available && s.verified);
  return (
    <WorkflowPanel title="Conflict details">
      <button className="button" onClick={onClose}>
        Close conflict
      </button>
      {actions.feedback}
      <State error={resource.error} loading={resource.loading}>
        {t && (
          <>
            <Badge state={t.status} />
            <p className="section-note">Sent by {t.display_name}</p>
            <h3>Original question</h3>
            <p>{t.description}</p>
            {t.conflict_context ? (
              <>
                <p className="section-note">
                  As of {t.conflict_context.as_of} ·{" "}
                  {t.conflict_context.population.replaceAll("_", " ")} ·{" "}
                  {t.conflict_context.jurisdiction}
                </p>
                <h3>Conflicting policy versions</h3>
                <div className="reaudit-source-grid">
                  {sources.map((s) => (
                    <article className="reaudit-source" key={s.clause_id}>
                      <h3>
                        {s.title}
                        {s.version_label && ` · ${s.version_label}`}
                      </h3>
                      {s.available && s.verified ? (
                        <>
                          <blockquote>{s.text}</blockquote>
                          <p>
                            Effective {s.valid_from} to{" "}
                            {s.valid_to || "open-ended"} · {s.locator}
                          </p>
                          <Link
                            to={`/documents/${s.document_id}?version=${s.version_id}`}
                          >
                            Open this exact source version
                          </Link>
                        </>
                      ) : (
                        <p role="alert">
                          {s.available
                            ? "Source integrity changed. This conflict cannot be resolved until its sources are verified."
                            : "Source access was revoked. Restore the explicit review grant before choosing a primary policy."}
                        </p>
                      )}
                      {t.conflict_context?.selected_clause_id ===
                        s.clause_id && (
                        <p>
                          <strong>Current primary policy</strong>
                        </p>
                      )}
                    </article>
                  ))}
                </div>
                {t.resolution && (
                  <section>
                    <h3>Primary policy decision</h3>
                    <p>{t.resolution}</p>
                  </section>
                )}
                <form
                  className="workflow-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fields = new FormData(e.currentTarget);
                    const undo = t.status === "resolved";
                    actions.prepare(
                      `/policy-tickets/${id}/${undo ? "rollback" : "resolve"}`,
                      {
                        expected_revision: t.revision,
                        reason: fields.get("reason"),
                        ...(!undo
                          ? { clause_id: fields.get("clause_id") }
                          : {}),
                      },
                      undo
                        ? "Undo primary / Reopen conflict"
                        : "Select primary policy",
                      undo
                        ? "This removes the current primary choice, restores Cortex's conflict abstention, invalidates answers based on that decision and reopens this review. The prior decision stays in history."
                        : "Cortex will use this policy only for the same conflicting versions and scope. Original policies, dates and source authority stay unchanged.",
                    );
                  }}
                >
                  <fieldset
                    disabled={
                      actions.readOnly ||
                      actions.busy ||
                      (t.status === "pending" && !canResolve)
                    }
                  >
                    {t.status === "pending" && (
                      <label>
                        Primary policy
                        <select
                          aria-label="Primary policy"
                          name="clause_id"
                          required
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Choose one of the conflicting versions
                          </option>
                          {sources.map((s) => (
                            <option
                              key={s.clause_id}
                              value={s.clause_id}
                              disabled={!s.available || !s.verified}
                            >
                              {s.title}
                              {s.version_label &&
                                ` · ${s.version_label}`} ·{" "}
                              {s.locator || "Source unavailable"}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label>
                      {t.status === "resolved"
                        ? "Undo reason"
                        : "Decision explanation"}
                      <textarea
                        name="reason"
                        minLength={5}
                        maxLength={4000}
                        required
                      />
                    </label>
                    <button className="button primary">
                      {t.status === "resolved"
                        ? "Undo / Reopen conflict"
                        : "Review primary policy choice"}
                    </button>
                  </fieldset>
                </form>
                {t.status === "pending" && !canResolve && (
                  <p className="form-error" role="alert">
                    Both source versions must be available and verified before a
                    primary policy can be chosen.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="section-note">
                  Historical manual ticket. This record is retained for history;
                  send a detected conflict from Ask Cortex to create an
                  actionable review.
                </p>
                <h3>Historical policies</h3>
                <ul>
                  {t.policies?.map((p) => (
                    <li key={p.document_id}>
                      {p.available ? (
                        <Link to={"/documents/" + p.document_id}>
                          {p.title}
                        </Link>
                      ) : (
                        p.title
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {Boolean(t.attachments?.length) && (
              <>
                <h3>Historical supporting evidence</h3>
                <ul>
                  {t.attachments?.map((a) => (
                    <li key={a.id}>
                      <a
                        href={`/api/v1/policy-tickets/${id}/attachments/${a.id}`}
                      >
                        {a.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h3>Complete decision history</h3>
            <ol>
              {t.history?.map((h, i) => (
                <li key={i}>
                  <strong>{h.operation}</strong> · {h.actor} ·{" "}
                  <time>{h.created_at}</time>
                  <p>{h.reason}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </State>
    </WorkflowPanel>
  );
}
