import { Link } from "react-router-dom";
import { PageHeading, State, useResource } from "../components";
import { useWorkflowActions, WorkflowPanel } from "../WorkflowActions";

export default function PolicyReviews() {
  const { data, error, loading } = useResource<{
    items: {
      version_id: string;
      document_id: string;
      title: string;
      version_label: string;
      submitted_at: string;
    }[];
  }>("/policy-reviews");
  const headings = useResource<{ items: { id: string; name: string }[] }>(
    "/policy-headings",
  );
  const actions = useWorkflowActions(headings.reload, false);
  return (
    <>
      <PageHeading
        eyebrow="Governance"
        title="Policy reviews"
        description="Review submitted versions independently. Approval makes a version eligible for Admin distribution."
      />
      {actions.feedback}
      <WorkflowPanel title="Policy headings">
        <State error={headings.error} loading={headings.loading}>
          <ul>
            {headings.data?.items.map((h) => (
              <li key={h.id}>{h.name}</li>
            ))}
          </ul>
          {!headings.data?.items.length && (
            <p className="empty-note">No policy headings yet.</p>
          )}
          <form
            className="workflow-form"
            onSubmit={(e) => {
              e.preventDefault();
              actions.prepare(
                "/policy-headings",
                { name: new FormData(e.currentTarget).get("name") },
                "Create policy heading",
                "Existing normalized names will be reused.",
              );
            }}
          >
            <fieldset disabled={actions.readOnly || actions.busy}>
              <label>
                New heading
                <input name="name" minLength={2} maxLength={100} required />
              </label>
              <button className="button">Review heading</button>
            </fieldset>
          </form>
        </State>
      </WorkflowPanel>
      <WorkflowPanel title="Awaiting Auditor review">
        <State error={error} loading={loading}>
          {data?.items.length ? (
            data.items.map((v) => (
              <div className="collection-row" key={v.version_id}>
                <div>
                  <strong>{v.title}</strong>
                  <p>
                    {v.version_label} · submitted {v.submitted_at}
                  </p>
                </div>
                <Link className="button" to={"/documents/" + v.document_id}>
                  Review policy
                </Link>
              </div>
            ))
          ) : (
            <p className="empty-note">No submitted policies await review.</p>
          )}
        </State>
      </WorkflowPanel>
    </>
  );
}
