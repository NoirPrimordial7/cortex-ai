import { useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileTextIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { Citation, Source } from "./types";
import { HighlightedSource } from "./SourcePassage";
export function SourceInspector({
  citation,
  source,
  busy,
  conflict = false,
  context,
  formatDate = (date) => date,
}: {
  citation: Citation | null;
  source: Source | null;
  busy: boolean;
  conflict?: boolean;
  context?: { date: string; population: string };
  formatDate?: (date: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!citation) return null;
  return (
    <div className="fb-document">
      <p className="fb-label">Source evidence</p>
      <h2>{citation.title}</h2>
      {context && (
        <p className="source-query-context">
          For{" "}
          {context.population === "india_full_time"
            ? "India full-time employees"
            : context.population === "india_contractor"
              ? "India contractors"
              : context.population.replaceAll("_", " ")}{" "}
          · as of {formatDate(context.date)}
        </p>
      )}
      {busy ? (
        <p role="status" className="fb-source-loading">
          Checking source access…
        </p>
      ) : (
        source && (
          <>
            <span className={"fb-status " + (conflict ? "is-conflict" : "")}>
              {conflict ? (
                <WarningCircleIcon size={16} />
              ) : (
                <CheckCircleIcon size={16} />
              )}{" "}
              {conflict ? "Unresolved conflict" : "Approved · valid"}
            </span>
            <section className="fb-passage">
              <h3 className="fb-label">Exact passage</h3>
              <blockquote>
                {source.text.slice(source.start_char, source.end_char)}
              </blockquote>
            </section>
            <div className="source-summary">
              <span>{source.locator}</span>
              <span>
                Effective {formatDate(source.valid_from)} →{" "}
                {source.valid_to ? formatDate(source.valid_to) : "open-ended"}
                {source.valid_to ? " (end exclusive)" : ""}
              </span>
            </div>
            <details className="source-details">
              <summary>Version & authority</summary>
              <dl className="fb-metadata">
                <div>
                  <dt>Version</dt>
                  <dd>{source.version_id}</dd>
                </div>
                <div>
                  <dt>Source type</dt>
                  <dd>{source.source_kind.replaceAll("_", " ")}</dd>
                </div>
                {source.authority_rank !== undefined && (
                  <div>
                    <dt>Authority rank</dt>
                    <dd>{source.authority_rank}</dd>
                  </div>
                )}
                <div>
                  <dt>Source hash</dt>
                  <dd>
                    <code>{source.source_hash}</code>
                  </dd>
                </div>
              </dl>
            </details>
            <button
              className="fb-context-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              <FileTextIcon size={18} />
              {expanded ? "Hide source context" : "View source context"}
              <ArrowRightIcon size={16} />
            </button>
            {expanded && (
              <div className="fb-context">
                <HighlightedSource source={source} />
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
export function PolicySource({
  citation,
  index,
  onInspect,
}: {
  citation: Citation;
  index: number;
  onInspect: () => void;
}) {
  return (
    <button
      className="fb-citation"
      aria-label={"View evidence: " + citation.title}
      onClick={onInspect}
    >
      <span className="fb-citation-number">{index + 1}</span>
      <strong>{citation.title}</strong>
      <span className="fb-citation-action">View evidence</span>
      <ArrowRightIcon size={18} />
    </button>
  );
}
