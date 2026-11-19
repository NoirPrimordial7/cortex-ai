import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, PageHeading, State, useResource } from "../components";
import { useSession } from "../session";
import { useWorkflowActions, WorkflowPanel } from "../WorkflowActions";
import { RecordPager } from "../RecordPager";
import type { DocumentItem, PolicyTicket } from "../types";

export default function PolicyTickets() {
  const { user } = useSession();
  const employee = Boolean(user?.actions.includes("ticket.create"));
  const tickets = useResource<{ items: PolicyTicket[] }>("/policy-tickets");
  const policies = useResource<{ items: DocumentItem[] }>("/documents");
  const notices = useResource<{
    items: {
      id: string;
      ticket_id: string;
      message: string;
      read_at: string | null;
    }[];
  }>("/notifications");
  const [selected, setSelected] = useState(""),
    [page, setPage] = useState(0);
  const actions = useWorkflowActions(() => {
    tickets.reload();
    notices.reload();
  });
  const records = tickets.data?.items || [];
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(records.length / 10) - 1),
  );
  return (
    <>
      <PageHeading
        eyebrow="Governance"
        title="Policy re-audit tickets"
        description="Ask an Auditor to investigate conflicting policies. Ticket decisions preserve the policy evidence and its original approval history."
      />
      {actions.feedback}
      {employee && (
        <WorkflowPanel title="Raise policy conflict">
          <State error={policies.error} loading={policies.loading}>
            {policies.data?.items.length ? (
              <form
                className="workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fields = new FormData(e.currentTarget);
                  actions.prepare(
                    "/policy-tickets",
                    {
                      document_ids: fields.getAll("document_ids"),
                      description: fields.get("description"),
                    },
                    "Submit re-audit ticket",
                    "Your selected policies and explanation will be sent to the Auditor.",
                  );
                }}
              >
                <fieldset disabled={actions.readOnly || actions.busy}>
                  <legend>Select one to five assigned policies</legend>
                  {policies.data.items.map((d) => (
                    <label className="check-label" key={d.id}>
                      <input type="checkbox" name="document_ids" value={d.id} />
                      {d.title}
                    </label>
                  ))}
                  <label>
                    Conflict or confusion
                    <textarea
                      name="description"
                      minLength={10}
                      maxLength={4000}
                      required
                    />
                  </label>
                  <p className="section-note">
                    After submission, open the pending ticket to attach
                    supporting evidence.
                  </p>
                  <button className="button primary">
                    Review ticket submission
                  </button>
                </fieldset>
              </form>
            ) : (
              <p className="empty-note">
                No assigned policies are available for a ticket.
              </p>
            )}
          </State>
        </WorkflowPanel>
      )}
      {employee && (
        <WorkflowPanel title="Ticket notifications">
          <State error={notices.error} loading={notices.loading}>
            {notices.data?.items.length ? (
              notices.data.items.map((n) => (
                <div className="collection-row" key={n.id}>
                  <div>
                    <p>{n.message}</p>
                    <button
                      className="button"
                      onClick={() => setSelected(n.ticket_id)}
                    >
                      Open ticket
                    </button>
                  </div>
                  {!n.read_at && (
                    <button
                      className="button"
                      disabled={actions.readOnly}
                      onClick={() =>
                        actions.prepare(
                          `/notifications/${n.id}/read`,
                          {},
                          "Mark notification read",
                          n.message,
                        )
                      }
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="empty-note">No notifications yet.</p>
            )}
          </State>
        </WorkflowPanel>
      )}
      <WorkflowPanel title={employee ? "Your tickets" : "Employee tickets"}>
        <State error={tickets.error} loading={tickets.loading}>
          {records.length ? (
            records.slice(current * 10, (current + 1) * 10).map((t) => (
              <div className="collection-row" key={t.id}>
                <div>
                  <Badge state={t.status} />
                  <p className="section-note">{t.display_name}</p>
                  <p>{t.description}</p>
                </div>
                <button className="button" onClick={() => setSelected(t.id)}>
                  Open ticket
                </button>
              </div>
            ))
          ) : (
            <p className="empty-note">No tickets to show.</p>
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
        <TicketDetail
          key={selected}
          id={selected}
          employee={employee}
          onClose={() => setSelected("")}
          onChange={() => {
            tickets.reload();
            notices.reload();
          }}
        />
      )}
    </>
  );
}

function TicketDetail({
  id,
  employee,
  onClose,
  onChange,
}: {
  id: string;
  employee: boolean;
  onClose: () => void;
  onChange: () => void;
}) {
  const resource = useResource<PolicyTicket>("/policy-tickets/" + id);
  const actions = useWorkflowActions(() => {
    resource.reload();
    onChange();
  });
  const t = resource.data;
  return (
    <WorkflowPanel title="Ticket details">
      <button className="button" onClick={onClose}>
        Close ticket
      </button>
      {actions.feedback}
      <State error={resource.error} loading={resource.loading}>
        {t && (
          <>
            <Badge state={t.status} />
            <p className="section-note">Employee: {t.display_name}</p>
            <p>{t.description}</p>
            <h3>Policies involved</h3>
            <ul>
              {t.policies?.map((p) => (
                <li key={p.document_id}>
                  {p.available ? (
                    <Link to={"/documents/" + p.document_id}>{p.title}</Link>
                  ) : (
                    p.title
                  )}
                  {t.selected_document_id === p.document_id &&
                    " · Selected resolution policy"}
                </li>
              ))}
            </ul>
            {t.resolution && (
              <section>
                <h3>Auditor resolution</h3>
                <p>{t.resolution}</p>
              </section>
            )}
            <h3>Supporting evidence</h3>
            <ul>
              {t.attachments?.map((a) => (
                <li key={a.id}>
                  <a href={`/api/v1/policy-tickets/${id}/attachments/${a.id}`}>
                    {a.filename}
                  </a>
                  <p className="hash-value">SHA-256 {a.sha256}</p>
                </li>
              ))}
            </ul>
            {!t.attachments?.length && (
              <p className="empty-note">No evidence attached.</p>
            )}
            {employee && t.status === "pending" && (
              <form
                className="workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  actions.prepare(
                    `/policy-tickets/${id}/attachments`,
                    new FormData(e.currentTarget),
                    "Attach supporting evidence",
                    "The attachment is stored as ticket evidence and is never indexed as a policy.",
                  );
                }}
              >
                <fieldset disabled={actions.readOnly || actions.busy}>
                  <label>
                    Evidence file
                    <input
                      name="file"
                      type="file"
                      accept=".txt,.pdf,.docx"
                      required
                    />
                  </label>
                  <p className="section-note">
                    TXT, PDF or DOCX, up to 2 MiB each, five files per ticket.
                    Download files only from sources you trust.
                  </p>
                  <button className="button">Review attachment</button>
                </fieldset>
              </form>
            )}
            {!employee && (
              <form
                className="workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = Object.fromEntries(new FormData(e.currentTarget));
                  actions.prepare(
                    `/policy-tickets/${id}/${t.status === "resolved" ? "rollback" : "resolve"}`,
                    {
                      expected_revision: t.revision,
                      reason: v.reason,
                      ...(t.status === "pending"
                        ? { document_id: v.document_id }
                        : {}),
                    },
                    t.status === "resolved"
                      ? "Rollback resolution"
                      : "Resolve policy conflict",
                    "This decision is appended to the ticket history and the employee is notified.",
                  );
                }}
              >
                <fieldset disabled={actions.readOnly || actions.busy}>
                  {t.status === "pending" && (
                    <label>
                      Resolution policy
                      <select
                        aria-label="Resolution policy"
                        name="document_id"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Choose relevant policy
                        </option>
                        {t.policies
                          ?.filter((p) => p.available)
                          .map((p) => (
                            <option key={p.document_id} value={p.document_id}>
                              {p.title}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  <label>
                    {t.status === "resolved"
                      ? "Rollback reason"
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
                      ? "Review rollback"
                      : "Review resolution"}
                  </button>
                </fieldset>
              </form>
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
