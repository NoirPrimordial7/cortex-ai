import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  FileTextIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { PageHeading, State, useResource } from "../components";
import { useSession } from "../session";
import type { Answer, DocumentItem } from "../types";
type DashboardData = {
  readable_documents: number;
  unresolved_queries: number;
  recent: Answer[];
  documents: DocumentItem[];
};
export default function Dashboard() {
  const { user } = useSession();
  const { data, error, loading } = useResource<DashboardData>("/dashboard");
  return (
    <>
      <PageHeading
        eyebrow="NORTHSTAR WORKS"
        title="Knowledge overview"
        description="Find the policy that applies—with the evidence to understand it."
      />
      <section className="welcome">
        <div>
          <p className="eyebrow">
            GOOD TO SEE YOU, {user?.display_name.split(" ")[0].toUpperCase()}
          </p>
          <h2>Clarity starts with a question.</h2>
          <p>Open your assistant to explore approved policy evidence.</p>
        </div>
        {user?.actions.includes("query.execute") && (
          <Link className="button primary" to="/assistant">
            Ask Cortex
            <ArrowRightIcon size={18} />
          </Link>
        )}
      </section>
      <State error={error} loading={loading}>
        {data && (
          <>
            <div className="overview-strip">
              <Link to="/documents">
                <FileTextIcon size={22} />
                <div>
                  <strong>{data.readable_documents}</strong>
                  <span>Documents you can read</span>
                </div>
                <ArrowRightIcon size={18} />
              </Link>
              <Link to="/history">
                <ClockCounterClockwiseIcon size={22} />
                <div>
                  <strong>{data.recent.length}</strong>
                  <span>Recent permitted answers</span>
                </div>
                <ArrowRightIcon size={18} />
              </Link>
              <Link to="/conflicts">
                <BookOpenTextIcon size={22} />
                <div>
                  <strong>{data.unresolved_queries}</strong>
                  <span>Your unresolved conflicts</span>
                </div>
                <ArrowRightIcon size={18} />
              </Link>
            </div>
            <div className="dashboard-columns">
              <section className="collection-panel">
                <div className="section-heading">
                  <h2>In your library</h2>
                  <Link to="/documents">
                    View all
                    <ArrowRightIcon size={16} />
                  </Link>
                </div>
                {data.documents.map((d) => (
                  <Link
                    className="collection-row"
                    to={"/documents/" + d.id}
                    key={d.id}
                  >
                    <FileTextIcon size={23} weight="light" />
                    <div>
                      <strong>{d.title}</strong>
                      <span>
                        {d.version_count} versions · {d.category}
                      </span>
                    </div>
                    <ArrowRightIcon size={16} />
                  </Link>
                ))}
              </section>
              <section className="activity-panel">
                <div className="section-heading">
                  <h2>Your recent activity</h2>
                </div>
                {data.recent.length === 0 ? (
                  <p className="empty-note">
                    Your supported answers will appear here after you ask a
                    question.
                  </p>
                ) : (
                  data.recent.map((q) => (
                    <Link
                      className="activity-row"
                      to="/history"
                      key={q.query_id}
                    >
                      <span className="activity-dot" />
                      <div>
                        <strong>{q.answer}</strong>
                        <span>
                          {q.as_of} · {q.status}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </section>
            </div>
          </>
        )}
      </State>
    </>
  );
}
