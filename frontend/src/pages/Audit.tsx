import { useState } from "react";
import { PageHeading, State, useResource } from "../components";
import { RecordPager } from "../RecordPager";
type AuditEvent = {
  created_at: string;
  action: string;
  outcome: string;
  request_id: string;
};
export default function Audit() {
  const { data, error, loading } = useResource<{ items: AuditEvent[] }>(
    "/audit-events",
  );
  const [action, setAction] = useState("all"),
    [outcome, setOutcome] = useState("all"),
    [page, setPage] = useState(0);
  const items =
    data?.items.filter(
      (e) =>
        (action === "all" || e.action === action) &&
        (outcome === "all" || e.outcome === outcome),
    ) || [];
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(items.length / 12) - 1),
  );
  const visible = items.slice(currentPage * 12, (currentPage + 1) * 12);
  const day = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(value));
  return (
    <>
      <PageHeading
        eyebrow="Governance"
        title="Audit activity"
        description="A trace of workspace actions. Sanitized events exclude document text, credentials and raw questions."
      />
      <section className="audit-journal">
        <div className="record-toolbar">
          <div>
            <h2>Workspace journal</h2>
            <p className="section-note">
              Latest 100 events at most · timestamps in UTC
            </p>
          </div>
          <label>
            Action
            <select
              name="audit-action"
              aria-label="Action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All</option>
              {[...new Set(data?.items.map((e) => e.action))].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            Outcome
            <select
              name="audit-outcome"
              aria-label="Outcome"
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All</option>
              {[...new Set(data?.items.map((e) => e.outcome))].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
        <State error={error} loading={loading}>
          {visible.length ? (
            visible.map((e, i) => (
              <div key={e.request_id + e.action + e.created_at}>
                {(i === 0 ||
                  day(e.created_at) !== day(visible[i - 1].created_at)) && (
                  <h3 className="journal-day">{day(e.created_at)}</h3>
                )}
                <article className="journal-event">
                  <time dateTime={e.created_at}>
                    {new Intl.DateTimeFormat("en-GB", {
                      timeStyle: "medium",
                      timeZone: "UTC",
                    }).format(new Date(e.created_at))}
                    <span>UTC</span>
                  </time>
                  <div>
                    <h3>{e.action.replaceAll(".", " · ")}</h3>
                    <details>
                      <summary>Request ID</summary>
                      <code>{e.request_id}</code>
                    </details>
                  </div>
                  <span className="badge neutral">{e.outcome}</span>
                </article>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <h2>No events to show</h2>
              <p>
                {action !== "all" || outcome !== "all"
                  ? "Try another action or outcome."
                  : "Workspace workflows will appear here."}
              </p>
            </div>
          )}
          <RecordPager
            page={currentPage}
            total={items.length}
            size={12}
            onPage={setPage}
          />
        </State>
      </section>
    </>
  );
}
