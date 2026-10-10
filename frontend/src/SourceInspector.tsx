import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileTextIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { Citation, Source, Detail, Version, Content } from "./types";
import { HighlightedSource } from "./SourcePassage";
import { sourceSlice } from "./sourceText";
import { api } from "./api";
import { SourceDialog } from "./components";
const DocumentReader = lazy(() => import("./DocumentReader"));
const OriginalPdf = lazy(() => import("./OriginalPdf"));
export function SourceInspector({
  citation,
  source,
  busy,
  conflict = false,
  context,
  formatDate = (date) => date,
  askFolio,
  onReturn,
  returnLabel = "Back to answer",
  onDeniedReader,
}: {
  citation: Citation | null;
  source: Source | null;
  busy: boolean;
  conflict?: boolean;
  context?: { date: string; population: string };
  formatDate?: (date: string) => string;
  askFolio?: number;
  onReturn?: () => void;
  returnLabel?: string;
  onDeniedReader?: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fresh, setFresh] = useState<Source | null>(null),
    [full, setFull] = useState(false),
    [version, setVersion] = useState<Version | null>(null),
    [reading, setReading] = useState(false),
    [readError, setReadError] = useState("");
  const epoch = useRef(0);
  const [content, setContent] = useState<Content | null>(null),
    [original, setOriginal] = useState(false);
  useEffect(() => {
    const clear = () => {
      epoch.current++;
      setFresh(null);
      setExpanded(false);
      setFull(false);
      setVersion(null);
      setReading(false);
      setContent(null);
      setOriginal(false);
    };
    window.addEventListener("cortex:evidence-changed", clear);
    return () => {
      epoch.current++;
      window.removeEventListener("cortex:evidence-changed", clear);
    };
  }, []);
  async function openReader(complete = false) {
    if (!source || reading) return;
    const stamp = ++epoch.current;
    setReading(true);
    setReadError("");
    setFresh(null);
    try {
      const checked = await api<Source>(
        `/queries/${source.query_id}/citations/${source.id}${complete ? "" : "?view=passage"}`,
      );
      if (
        checked.source_hash !== source.source_hash ||
        sourceSlice(
          checked.text,
          checked.start_char - (checked.text_start_char || 0),
          checked.end_char - (checked.text_start_char || 0),
        ) !== checked.quote
      )
        throw new Error("Evidence changed; ask again");
      let metadata: Version | undefined;
      let completeContent: Content | undefined;
      if (complete) {
        const [detail, body] = await Promise.all([
          api<Detail>(`/documents/${checked.document_id}`),
          api<Content>(`/versions/${checked.version_id}/content`),
        ]);
        if (
          body.source_hash !== checked.source_hash ||
          body.text !== checked.text
        )
          throw new Error("Evidence changed; ask again");
        completeContent = body;
        metadata = detail.versions.find((v) => v.id === checked.version_id);
        if (!metadata) throw new Error("Resource unavailable");
      }
      if (epoch.current === stamp) {
        setFresh(checked);
        setVersion(metadata || null);
        setExpanded(true);
        setFull(complete);
        setContent(completeContent || null);
        setOriginal(false);
      }
    } catch (e) {
      if (epoch.current === stamp) {
        setReadError((e as Error).message);
        window.dispatchEvent(new Event("cortex:evidence-changed"));
        onDeniedReader?.((e as Error).message);
      }
    } finally {
      if (epoch.current === stamp) setReading(false);
    }
  }
  if (!citation) return null;
  return (
    <div className={"fb-document" + (askFolio ? " fb-ask-document" : "")}>
      <p className="fb-label">
        {askFolio && <span className="fb-folio-number">{askFolio}</span>}Source
        evidence
      </p>
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
            {!expanded && (
              <section className="fb-passage">
                <h3 className="fb-label">Exact passage & nearby context</h3>
                <HighlightedSource source={source} />
              </section>
            )}
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
              disabled={reading}
              onClick={() =>
                expanded ? setExpanded(false) : void openReader()
              }
            >
              <FileTextIcon size={18} />
              {expanded ? "Hide source context" : "View source context"}
              <ArrowRightIcon size={16} />
            </button>
            {reading && <p role="status">Checking document access…</p>}
            {readError && <p role="alert">{readError}</p>}
            {expanded && fresh && (
              <div className="fb-context">
                <p className="reading-label">
                  Supporting passage with nearby context
                </p>
                <HighlightedSource source={fresh} />
                <button
                  className="button"
                  disabled={reading}
                  onClick={() => void openReader(true)}
                >
                  Read complete document
                </button>
              </div>
            )}
            {full && fresh && (
              <SourceDialog
                label="Complete authorized document"
                className="full-document-dialog"
                onClose={() => setFull(false)}
              >
                <button
                  className="button back-link"
                  onClick={() => {
                    setFull(false);
                    onReturn?.();
                  }}
                >
                  {returnLabel}
                </button>
                <h2>{fresh.title}</h2>
                <p className="section-note">
                  Version {version?.version_label || fresh.version_id} ·{" "}
                  {version?.approval_state || "Approved evidence"} · effective{" "}
                  {formatDate(fresh.valid_from)} →{" "}
                  {fresh.valid_to
                    ? formatDate(fresh.valid_to) + " (end exclusive)"
                    : "open-ended"}{" "}
                  · {fresh.source_kind.replaceAll("_", " ")} · authority rank{" "}
                  {fresh.authority_rank}
                </p>
                <a
                  className="button"
                  href={`/api/v1/versions/${fresh.version_id}/download`}
                >
                  Download original file
                </a>
                {content?.review && (
                  <p className="section-note">
                    Reviewed by {content.review.reviewer_name} ·{" "}
                    {content.review.reviewed_at} ·{" "}
                    {content.review.approval_state}
                  </p>
                )}
                {content?.original_preview_available && (
                  <button
                    className="button"
                    onClick={() => setOriginal(!original)}
                  >
                    {original
                      ? "Read highlighted extracted text"
                      : "View original PDF pages"}
                  </button>
                )}
                <Suspense
                  fallback={<p role="status">Opening document reader…</p>}
                >
                  {original && content ? (
                    <OriginalPdf
                      versionId={content.version_id}
                      onDenied={() => {
                        setFull(false);
                        onDeniedReader?.("Resource unavailable");
                      }}
                    />
                  ) : (
                    <DocumentReader
                      text={fresh.text}
                      title={fresh.title}
                      evidence={{
                        start: fresh.start_char,
                        end: fresh.end_char,
                      }}
                      locator={fresh.locator}
                    />
                  )}
                </Suspense>
                <details className="hash-details">
                  <summary>Source integrity</summary>
                  <code>{fresh.source_hash}</code>
                </details>
              </SourceDialog>
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
