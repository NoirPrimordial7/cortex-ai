import { useEffect, useRef, useState } from "react";
import { BookOpenTextIcon, XIcon } from "@phosphor-icons/react";
import { api } from "../api";
import { HighlightedSource } from "../SourcePassage";
import {
  Badge,
  PageHeading,
  SourceDialog,
  State,
  useResource,
} from "../components";
import type { Answer, Citation, Source } from "../types";
export default function Activity({
  conflicts = false,
  audit = false,
}: {
  conflicts?: boolean;
  audit?: boolean;
}) {
  const path = audit ? "/audit-events" : conflicts ? "/conflicts" : "/queries";
  const resource = useResource<
    | { items: Answer[] }
    | {
        items: {
          created_at: string;
          action: string;
          outcome: string;
          request_id: string;
        }[];
      }
  >(path);
  const queryItems = audit
    ? []
    : (resource.data?.items as Answer[] | undefined);
  const auditItems = audit
    ? (resource.data?.items as
        | {
            created_at: string;
            action: string;
            outcome: string;
            request_id: string;
          }[]
        | undefined)
    : [];
  const epoch = useRef(0);
  const [source, setSource] = useState<Source | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const clear = () => {
      epoch.current++;
      setSource(null);
      setError("");
    };
    window.addEventListener("cortex:evidence-changed", clear);
    return () => window.removeEventListener("cortex:evidence-changed", clear);
  }, []);
  async function inspect(q: Answer, c: Citation) {
    setSource(null);
    setError("");
    const current = ++epoch.current;
    try {
      const loaded = await api<Source>(
        `/queries/${q.query_id}/citations/${c.id}`,
      );
      if (current === epoch.current) setSource(loaded);
    } catch (e) {
      setError((e as Error).message);
      resource.reload();
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={audit ? "GOVERNANCE" : "YOUR EVIDENCE RECORD"}
        title={
          audit
            ? "Audit activity"
            : conflicts
              ? "Conflicts & validity"
              : "Answer history"
        }
        description={
          audit
            ? "Sanitized workspace events. Document text and raw questions are excluded."
            : conflicts
              ? "Inspect disagreements between policies you can currently read."
              : "Saved answers are rechecked against your current permissions and evidence revisions."
        }
      />
      <State error={resource.error || error} loading={resource.loading}>
        {resource.data?.items.length === 0 ? (
          <div className="empty-state">
            <BookOpenTextIcon size={32} />
            <h2>
              {conflicts
                ? "No readable conflicts in your history"
                : "Nothing to show yet"}
            </h2>
            <p>
              {conflicts
                ? "Ask about a policy in the assistant to inspect its evidence."
                : "Activity appears here after you use the workspace."}
            </p>
          </div>
        ) : audit ? (
          <div
            className="table-wrap audit-table"
            role="region"
            aria-label="Audit events; scroll horizontally on smaller screens"
            tabIndex={0}
          >
            <p className="audit-scroll-hint subtle">
              Scroll horizontally to inspect all event details.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Outcome</th>
                  <th>Request</th>
                </tr>
              </thead>
              <tbody>
                {auditItems?.map((e) => (
                  <tr key={e.request_id + e.action + e.created_at}>
                    <td>{e.created_at.replace("T", " ").slice(0, 19)} UTC</td>
                    <td>{e.action}</td>
                    <td>{e.outcome}</td>
                    <td>
                      <code>{e.request_id.slice(0, 8)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="history-list">
            {queryItems?.map((q) => (
              <article className="history-item" key={q.query_id}>
                <div className="section-heading">
                  <p className="eyebrow">AS OF {q.as_of}</p>
                  <Badge
                    state={
                      q.reason_code === "UNRESOLVED_CONFLICT"
                        ? "Conflict"
                        : q.status === "answered"
                          ? "Evidence answer"
                          : "Abstained"
                    }
                  />
                </div>
                <h2>{q.answer}</h2>
                <div className="conflict-comparison">
                  {q.citations.map((c) => (
                    <button
                      key={c.id}
                      className="conflict-source"
                      onClick={() => void inspect(q, c)}
                    >
                      <strong>{c.title}</strong>
                      <span>
                        {c.version_id} · effective {c.valid_from}
                      </span>
                      <blockquote>{c.quote}</blockquote>
                      <span className="source-link">Inspect exact source</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </State>
      {source && (
        <SourceDialog onClose={() => setSource(null)}>
          <button
            className="icon-button dialog-close"
            autoFocus
            aria-label="Close source"
            onClick={() => setSource(null)}
          >
            <XIcon size={20} />
          </button>
          <p className="eyebrow">
            {source.version_id} · {source.locator}
          </p>
          <h2>{source.title}</h2>
          <HighlightedSource source={source} />
        </SourceDialog>
      )}
    </>
  );
}
