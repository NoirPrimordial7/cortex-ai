import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge, PageHeading, State, useResource } from "../components";
import { ResponsiveTable } from "../FormPrimitives";
import { LeaveBalances } from "../LeaveBalances";
import { RecordPager } from "../RecordPager";
import { useSession } from "../session";
import { useWorkflowActions, WorkflowPanel } from "../WorkflowActions";
import type {
  LeaveBalance,
  LeaveBalanceItem,
  LeaveRequest,
  LeaveTeam,
} from "../types";

type LeaveType = Omit<LeaveBalanceItem, "balance_days"> & {
  id: string;
  active: boolean;
};

export default function LeaveManagement() {
  const { user } = useSession();
  const personal = Boolean(user?.actions.includes("leave.apply"));
  const canReview = Boolean(user?.actions.includes("leave.review"));
  const canAllocate = Boolean(user?.actions.includes("leave.manage"));
  const requests = useResource<{ items: LeaveRequest[] }>("/leave/requests");
  const balance = useResource<LeaveBalance | LeaveTeam>(
    personal ? "/leave/balance" : "/leave/team",
  );
  const types = useResource<{ items: LeaveType[] }>("/leave/types");
  const [selected, setSelected] = useState("");
  const [ledgerUser, setLedgerUser] = useState("");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("all");
  const actions = useWorkflowActions(() => {
    requests.reload();
    balance.reload();
    types.reload();
  });
  const items = (requests.data?.items ?? []).filter(
    (item) => status === "all" || item.status === status,
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(items.length / 10) - 1),
  );
  function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    actions.prepare(
      "/leave/requests",
      values,
      "Submit leave application",
      "The request will be pending until an Auditor reviews it. Pending requests do not reduce your balance.",
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="Workspace"
        title="Leave Management"
        description={
          personal
            ? "Your balances, applications and leave history."
            : "Employee balances and leave applications."
        }
      />
      {actions.feedback}
      <State
        error={balance.error || types.error}
        loading={balance.loading || types.loading}
      >
        {balance.data && (
          <WorkflowPanel title={personal ? "My leave" : "Employee balances"}>
            {"balances" in balance.data ? (
              <LeaveBalances balances={balance.data.balances} />
            ) : balance.data.items.length ? (
              <ResponsiveTable caption="Employee leave balances">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.data.items.map((person) => (
                    <tr key={person.user_id}>
                      <td>
                        {person.display_name}
                        <button
                          className="button"
                          onClick={() => setLedgerUser(person.user_id)}
                        >
                          View transaction history
                        </button>
                      </td>
                      <td data-label="Balance">
                        <LeaveBalances balances={person.balances} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResponsiveTable>
            ) : (
              <p className="empty-note">
                No active employees have balances to display.
              </p>
            )}
          </WorkflowPanel>
        )}
        {personal && (
          <WorkflowPanel title="Apply for leave">
            <p className="section-note">
              Days are counted Monday to Friday, including both dates. Public
              holidays are counted as weekdays.
            </p>
            <form className="workflow-form" onSubmit={apply}>
              <fieldset
                disabled={
                  actions.readOnly ||
                  actions.busy ||
                  !types.data?.items.some((t) => t.active)
                }
              >
                <div className="form-grid">
                  <label>
                    Leave type
                    <select
                      aria-label="Leave type"
                      name="leave_type_id"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose leave type
                      </option>
                      {types.data?.items
                        .filter((t) => t.active)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Start date
                    <input type="date" name="start_date" required />
                  </label>
                  <label>
                    End date
                    <input type="date" name="end_date" required />
                  </label>
                </div>
                <label>
                  Reason
                  <textarea
                    name="reason"
                    minLength={3}
                    maxLength={2000}
                    required
                  />
                </label>
                <button className="button primary">Review application</button>
              </fieldset>
            </form>
            {!types.data?.items.some((t) => t.active) && (
              <p className="empty-note">
                An Admin must configure a leave type before you can apply.
              </p>
            )}
          </WorkflowPanel>
        )}
        {canAllocate && balance.data && "items" in balance.data && (
          <>
            <WorkflowPanel title="Allocate or correct employee leave">
              <form
                className="workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const values = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  actions.prepare(
                    "/leave/ledger-entries",
                    { ...values, days: Number(values.days) },
                    "Record leave allocation",
                    "This adds a permanent signed ledger entry. Use a negative adjustment to correct an earlier credit.",
                  );
                }}
              >
                <fieldset disabled={actions.readOnly || actions.busy}>
                  <div className="form-grid">
                    <label>
                      Employee
                      <select name="user_id" required defaultValue="">
                        <option value="" disabled>
                          Choose employee
                        </option>
                        {balance.data.items.map((p) => (
                          <option key={p.user_id} value={p.user_id}>
                            {p.display_name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Leave type
                      <select
                        aria-label="Leave type"
                        name="leave_type_id"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Choose leave type
                        </option>
                        {types.data?.items.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Entry type
                      <select name="entry_type">
                        <option value="grant">Grant</option>
                        <option value="accrual">Accrual</option>
                        <option value="adjustment">Adjustment</option>
                        <option value="carry_forward">Carry forward</option>
                      </select>
                    </label>
                    <label>
                      Signed days
                      <input
                        type="number"
                        name="days"
                        min="-10000"
                        max="10000"
                        required
                      />
                    </label>
                    <label>
                      Effective date
                      <input type="date" name="effective_date" required />
                    </label>
                  </div>
                  <label>
                    Reference
                    <textarea name="reference" maxLength={1000} required />
                  </label>
                  <button className="button primary">Review allocation</button>
                </fieldset>
              </form>
            </WorkflowPanel>
            <WorkflowPanel title="Configure leave type">
              <p className="section-note">
                The annual entitlement is configuration. Allocate days through
                the ledger to credit an employee.
              </p>
              <form
                className="workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = Object.fromEntries(new FormData(e.currentTarget));
                  actions.prepare(
                    "/leave/types",
                    {
                      ...v,
                      annual_entitlement_days: Number(
                        v.annual_entitlement_days,
                      ),
                    },
                    "Create leave type",
                    "This type will become available to employees.",
                  );
                }}
              >
                <fieldset disabled={actions.readOnly || actions.busy}>
                  <div className="form-grid">
                    <label>
                      Code
                      <input
                        name="code"
                        pattern="[a-z][a-z0-9_]{1,29}"
                        required
                      />
                    </label>
                    <label>
                      Name
                      <input
                        name="name"
                        minLength={2}
                        maxLength={100}
                        required
                      />
                    </label>
                    <label>
                      Annual entitlement days
                      <input
                        name="annual_entitlement_days"
                        type="number"
                        min="0"
                        max="366"
                        required
                      />
                    </label>
                  </div>
                  <button className="button">Review leave type</button>
                </fieldset>
              </form>
            </WorkflowPanel>
          </>
        )}
      </State>
      <WorkflowPanel title="Applications">
        <label>
          Application status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All</option>
            {[
              "pending",
              "approved",
              "rejected",
              "withdrawn",
              "cancellation_pending",
              "cancelled",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <State error={requests.error} loading={requests.loading}>
          {items.length ? (
            <ResponsiveTable caption="Leave applications">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .slice(currentPage * 10, (currentPage + 1) * 10)
                  .map((r) => (
                    <tr key={r.id}>
                      <td>{r.display_name}</td>
                      <td data-label="Dates">
                        {r.start_date} to {r.end_date}
                      </td>
                      <td data-label="Days">{r.days}</td>
                      <td data-label="Status">
                        <Badge state={r.status.replaceAll("_", " ")} />
                      </td>
                      <td>
                        <button
                          className="button"
                          onClick={() => setSelected(r.id)}
                        >
                          Open application
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </ResponsiveTable>
          ) : (
            <p className="empty-note">No applications to show.</p>
          )}
          <RecordPager
            page={currentPage}
            total={items.length}
            size={10}
            onPage={setPage}
          />
        </State>
      </WorkflowPanel>
      {selected && (
        <LeaveDetail
          key={selected}
          id={selected}
          personal={personal}
          review={canReview}
          onClose={() => setSelected("")}
          onChange={() => {
            setSelected("");
            requests.reload();
            balance.reload();
          }}
        />
      )}
      {(personal || ledgerUser) && (
        <LedgerHistory key={ledgerUser} userId={personal ? "" : ledgerUser} />
      )}
      <p className="section-note">
        Policy entitlements can be checked in{" "}
        <Link to="/assistant">Ask Cortex</Link>.
      </p>
    </>
  );
}

function LedgerHistory({ userId }: { userId: string }) {
  const { data, error, loading } = useResource<{
    items: {
      id: string;
      entry_type: string;
      days: number;
      effective_date: string;
      leave_type_name: string;
      reference: string | null;
    }[];
  }>(
    "/leave/ledger" + (userId ? "?user_id=" + encodeURIComponent(userId) : ""),
  );
  return (
    <WorkflowPanel title="Leave transaction history">
      <State error={error} loading={loading}>
        {data?.items.length ? (
          <ResponsiveTable caption="Leave transactions">
            <thead>
              <tr>
                <th>Type</th>
                <th>Days</th>
                <th>Effective</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.leave_type_name} · {e.entry_type}
                  </td>
                  <td data-label="Days">{e.days}</td>
                  <td data-label="Effective">{e.effective_date}</td>
                  <td data-label="Reference">
                    {e.reference || "No reference"}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        ) : (
          <p className="empty-note">No leave transactions.</p>
        )}
      </State>
    </WorkflowPanel>
  );
}

function LeaveDetail({
  id,
  personal,
  review,
  onClose,
  onChange,
}: {
  id: string;
  personal: boolean;
  review: boolean;
  onClose: () => void;
  onChange: () => void;
}) {
  const { data, error, loading } = useResource<LeaveRequest>(
    "/leave/requests/" + id,
  );
  const actions = useWorkflowActions(onChange);
  return (
    <WorkflowPanel title="Application details">
      <button className="button" onClick={onClose}>
        Close application
      </button>
      {actions.feedback}
      <State error={error} loading={loading}>
        {data && (
          <>
            <h3>
              {data.display_name} · {data.leave_type_name}
            </h3>
            <p>
              {data.start_date} to {data.end_date} · {data.days} days
            </p>
            <p>{data.reason}</p>
            <Badge state={data.status.replaceAll("_", " ")} />
            {data.review_comment && (
              <p>Auditor comment — {data.review_comment}</p>
            )}
            {((personal && ["pending", "approved"].includes(data.status)) ||
              (review &&
                ["pending", "cancellation_pending"].includes(data.status))) && (
              <form
                className="workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = Object.fromEntries(new FormData(e.currentTarget));
                  const cancel = data.status === "cancellation_pending";
                  actions.prepare(
                    `/leave/requests/${id}/${personal ? "withdraw" : "decision"}`,
                    personal
                      ? { expected_revision: data.revision, reason: v.comment }
                      : {
                          expected_revision: data.revision,
                          comment: v.comment,
                          decision: v.decision,
                        },
                    personal
                      ? data.status === "approved"
                        ? "Request cancellation"
                        : "Withdraw application"
                      : cancel
                        ? "Review cancellation"
                        : "Review leave",
                    personal
                      ? "Pending applications can be withdrawn immediately. Approved leave needs Auditor approval before days are restored."
                      : "This decision is recorded in the application history. An approved leave deduction or cancellation reversal is applied once.",
                  );
                }}
              >
                <fieldset disabled={actions.readOnly || actions.busy}>
                  {!personal && (
                    <label>
                      Decision
                      <select name="decision">
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </label>
                  )}
                  <label>
                    {personal ? "Withdrawal reason" : "Review comment"}
                    <textarea
                      name="comment"
                      minLength={3}
                      maxLength={2000}
                      required
                    />
                  </label>
                  <button className="button primary">
                    {personal
                      ? data.status === "approved"
                        ? "Request cancellation"
                        : "Withdraw pending application"
                      : "Review decision"}
                  </button>
                </fieldset>
              </form>
            )}
            <h3>Application history</h3>
            <ol>
              {data.history?.map((h, i) => (
                <li key={i}>
                  <strong>{h.status.replaceAll("_", " ")}</strong> · {h.actor} ·{" "}
                  <time>{h.created_at}</time>
                  <p>{h.comment}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </State>
    </WorkflowPanel>
  );
}
