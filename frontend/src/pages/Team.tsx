import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { leavePaths } from "../api";
import { PageHeading, State, useResource } from "../components";
import { FormField, ResponsiveTable } from "../FormPrimitives";
import { LeaveBalances } from "../LeaveBalances";
import { RecordPager } from "../RecordPager";
import type { LeaveTeam, ReportBalance } from "../types";

const pageSize = 12;

export default function Team() {
  const { userId } = useParams();
  return userId ? <ReportDetail userId={userId} /> : <TeamList />;
}

function TeamList() {
  const { data, error, loading } = useResource<LeaveTeam>(leavePaths.team);
  const [page, setPage] = useState(0);
  const items = data?.items ?? [];
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(items.length / pageSize) - 1),
  );
  const visible = items.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  return (
    <>
      <PageHeading
        eyebrow="Workspace"
        title="Team leave"
        description="Leave balances for your current direct reports."
      />
      <State error={error} loading={loading}>
        {data && (
          <section
            className="panel leave-panel"
            aria-labelledby="direct-reports"
          >
            <h2 id="direct-reports">Direct reports</h2>
            <p className="section-note">
              Balances as of <time dateTime={data.as_of}>{data.as_of}</time>
            </p>
            {items.length ? (
              <>
                <ResponsiveTable
                  caption="Direct report leave balances"
                  className="leave-team-table"
                >
                  <thead>
                    <tr>
                      <th scope="col">Direct report</th>
                      <th scope="col">Leave balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((person) => (
                      <tr key={person.user_id}>
                        <td>
                          <Link
                            className="button"
                            to={`/team/${encodeURIComponent(person.user_id)}`}
                          >
                            {person.display_name}
                          </Link>
                        </td>
                        <td data-label="Leave balance">
                          <LeaveBalances balances={person.balances} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ResponsiveTable>
                {items.length > pageSize && (
                  <RecordPager
                    page={currentPage}
                    total={items.length}
                    size={pageSize}
                    onPage={setPage}
                    noun="direct reports"
                  />
                )}
              </>
            ) : (
              <p className="empty-note">You have no current direct reports.</p>
            )}
          </section>
        )}
      </State>
    </>
  );
}

function ReportDetail({ userId }: { userId: string }) {
  const [asOf, setAsOf] = useState("");
  const { data, error, loading } = useResource<ReportBalance>(
    leavePaths.employeeBalance(userId, asOf),
  );
  return (
    <>
      <Link className="button" to="/team">
        Back to team
      </Link>
      <PageHeading
        eyebrow="Team leave"
        title={data?.display_name ?? "Leave balance"}
        description="View this direct report’s balance by date."
      />
      <section className="panel leave-panel" aria-label="Leave balance">
        <FormField label="Balance date">
          <input
            type="date"
            aria-describedby="leave-date-hint"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
          />
        </FormField>
        <p id="leave-date-hint" className="section-note">
          Leave blank for today's balance.
        </p>
        <State error={error} loading={loading}>
          {data && (
            <>
              <p className="section-note">
                Balance as of <time dateTime={data.as_of}>{data.as_of}</time>
              </p>
              <LeaveBalances balances={data.balances} />
            </>
          )}
        </State>
      </section>
    </>
  );
}
