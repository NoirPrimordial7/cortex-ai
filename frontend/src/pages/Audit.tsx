import { ResponsiveTable } from "../FormPrimitives";
import { PageHeading, State, useResource } from "../components";
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
  return (
    <>
      <PageHeading
        eyebrow="Governance"
        title="Audit activity"
        description="Sanitized workspace events. Document text, credentials and raw questions are excluded."
      />
      <State error={error} loading={loading}>
        {data?.items.length ? (
          <ResponsiveTable
            className="audit-table"
            caption="Sanitized audit events, timestamps in UTC"
          >
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Action</th>
                <th>Outcome</th>
                <th>Request ID</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.request_id + e.action + e.created_at}>
                  <td data-label="Time">
                    <time dateTime={e.created_at}>
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(e.created_at))}{" "}
                      UTC
                    </time>
                  </td>
                  <td data-label="Action">{e.action.replaceAll(".", " · ")}</td>
                  <td data-label="Outcome">
                    <span className="badge neutral">{e.outcome}</span>
                  </td>
                  <td data-label="Request ID">
                    <code>{e.request_id}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        ) : (
          <div className="empty-state">
            <h2>No events to show</h2>
            <p>Successful workspace workflows will appear here.</p>
          </div>
        )}
      </State>
    </>
  );
}
