import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  FileTextIcon,
  WarningCircleIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { Badge, PageHeading, State, useResource } from "../components";
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
  const canAsk = user?.actions.includes("query.execute");
  const recent =
    data?.recent
      .filter(
        (q, i, all) =>
          all.findIndex(
            (x) =>
              x.answer === q.answer &&
              x.status === q.status &&
              x.as_of === q.as_of &&
              x.scope.population === q.scope.population,
          ) === i,
      )
      .slice(0, 3) || [];
  return (
    <>
      <PageHeading
        eyebrow="Workspace"
        title="Knowledge overview"
        description={`Hello, ${user?.display_name.split(" ")[0]}. Find the policy, check the context, and keep its evidence close.`}
      />
      <section className="overview-start">
        <div>
          <p className="eyebrow">Your evidence desk</p>
          <h2>
            {canAsk
              ? "Begin with a question.\nStay close to the source."
              : "A clear view of your workspace."}
          </h2>
          <p>
            Policy answers depend on the date, your scope and the documents you
            can read.
          </p>
          <div className="action-row">
            {canAsk && (
              <Link className="button primary" to="/assistant">
                Ask Cortex
                <ArrowRightIcon size={18} />
              </Link>
            )}
            <Link className="button" to="/documents">
              <MagnifyingGlassIcon size={18} />
              Browse policies
            </Link>
          </div>
        </div>
        <aside>
          <FileTextIcon size={24} />
          <strong>{data?.readable_documents ?? "—"}</strong>
          <span>documents available to you</span>
          {canAsk && data && (
            <Link to="/conflicts">
              <WarningCircleIcon size={18} />
              {data.unresolved_queries} unresolved{" "}
              {data.unresolved_queries === 1 ? "query" : "queries"}
              <ArrowRightIcon size={16} />
            </Link>
          )}
        </aside>
      </section>
      <State error={error} loading={loading}>
        {data && (
          <div className="dashboard-columns">
            <section className="collection-panel">
              <div className="section-heading">
                <h2>In your library</h2>
                <Link to="/documents">
                  View all
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
              {data.documents.length ? (
                data.documents.map((d) => (
                  <Link
                    className="collection-row"
                    to={"/documents/" + d.id}
                    key={d.id}
                  >
                    <FileTextIcon size={22} />
                    <div>
                      <strong>{d.title}</strong>
                      <span>
                        {d.version_count}{" "}
                        {d.version_count === 1 ? "version" : "versions"} ·{" "}
                        {d.category}
                      </span>
                    </div>
                    <ArrowRightIcon size={16} />
                  </Link>
                ))
              ) : (
                <p className="empty-note">
                  No documents are available under your current grants.
                </p>
              )}
            </section>
            <section className="activity-panel">
              <div className="section-heading">
                <h2>{canAsk ? "Recent answers" : "Workspace tools"}</h2>
                {canAsk && (
                  <Link to="/history">
                    All activity
                    <ArrowRightIcon size={16} />
                  </Link>
                )}
              </div>
              {canAsk ? (
                recent.length ? (
                  recent.map((q) => (
                    <Link
                      className="activity-row"
                      to="/history"
                      key={q.query_id}
                    >
                      <div>
                        <Badge
                          state={
                            q.reason_code === "UNRESOLVED_CONFLICT"
                              ? "Conflict"
                              : q.status === "answered"
                                ? "Evidence answer"
                                : "Abstained"
                          }
                        />
                        <strong>{q.answer}</strong>
                        <span>As of {q.as_of}</span>
                      </div>
                      <ArrowRightIcon size={16} />
                    </Link>
                  ))
                ) : (
                  <p className="empty-note">
                    Ask your first question to build an evidence record.
                    Repeated answers are grouped here; your full history keeps
                    every request.
                  </p>
                )
              ) : (
                <>
                  <p className="empty-note">
                    Read permitted documents and inspect workspace events using
                    your current role.
                  </p>
                  {user?.actions.includes("audit.read") && (
                    <Link className="button" to="/audit">
                      Review audit activity
                      <ArrowRightIcon size={16} />
                    </Link>
                  )}
                </>
              )}
              {canAsk && recent.length > 0 && (
                <p className="section-note">
                  Repeated answers are grouped here. Activity retains every
                  request.
                </p>
              )}
            </section>
          </div>
        )}
      </State>
    </>
  );
}
