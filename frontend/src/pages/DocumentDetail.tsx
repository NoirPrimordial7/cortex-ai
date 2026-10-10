import { populationName } from "../labels";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  ShieldCheckIcon,
  XIcon,
} from "@phosphor-icons/react";
import { api } from "../api";
import {
  Badge,
  PageHeading,
  State,
  useResource,
  versionState,
  SourceDialog,
} from "../components";
import { FilePicker } from "../FilePicker";
import { useSession } from "../session";
import type { Content, Detail, Version } from "../types";
import { sourceSlice } from "../sourceText";
const DocumentReader = lazy(() => import("../DocumentReader"));
const OriginalPdf = lazy(() => import("../OriginalPdf"));
function ReviewForm({
  v,
  content,
  done,
}: {
  v: Version;
  content: Content;
  done: () => void;
}) {
  const { user } = useSession();
  const [segment, setSegment] = useState(
      content.segments[1] || content.segments[0],
    ),
    [topic, setTopic] = useState(v.topic || "leave"),
    [open, setOpen] = useState(Boolean(v.valid_from && !v.valid_to)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (user?.read_only_demo) return;
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const mapping: Record<string, [string, string]> = {
      leave: ["annual_leave_days", "working_days_per_year"],
      remote_work: ["remote_days_per_week", "days_per_week"],
      notice: ["notice_period_days", "calendar_days"],
      bonus: ["executive_bonus", "INR"],
    };
    setBusy(true);
    setError("");
    const end =
      segment.end -
      (sourceSlice(content.text, segment.end - 1, segment.end) === "\n"
        ? 1
        : 0);
    try {
      await api(`/versions/${v.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          expected_metadata_revision: v.metadata_revision,
          approval_state: "approved",
          valid_from: values.valid_from,
          valid_to: open ? null : values.valid_to,
          open_ended: open,
          population: values.population,
          jurisdiction: "IN",
          topic,
          source_kind: values.source_kind,
          published_at: values.published_at,
          start_char: segment.start,
          end_char: end,
          claim: {
            subject: values.population,
            predicate: mapping[topic][0],
            unit: mapping[topic][1],
            value: Number(values.value),
            modality: "entitlement",
            condition_key: "default",
          },
          access_scope: "uniform",
          reason: values.reason,
        }),
      });
      window.dispatchEvent(new Event("cortex:evidence-changed"));
      done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="review-form" onSubmit={(e) => void submit(e)}>
      <fieldset
        disabled={busy || user?.read_only_demo}
        className="review-fields"
      >
        <h3>Review and approve this version</h3>
        <p className="description">
          Confirm uniform document access and select a source passage. Approval
          metadata comes from your review, not the uploaded text.
        </p>
        <label>
          Evidence passage
          <select
            value={segment.start}
            onChange={(e) =>
              setSegment(
                content.segments.find(
                  (s) => s.start === Number(e.target.value),
                )!,
              )
            }
          >
            {content.segments.map((s) => (
              <option key={s.start} value={s.start}>
                {s.locator} ·{" "}
                {sourceSlice(content.text, s.start, s.end).slice(0, 65)}
              </option>
            ))}
          </select>
        </label>
        <blockquote>
          {sourceSlice(content.text, segment.start, segment.end)}
        </blockquote>
        <div className="form-grid">
          <label>
            Policy topic
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="leave">Annual leave</option>
              <option value="remote_work">Remote work</option>
              <option value="notice">Notice period</option>
              <option value="bonus">Executive bonus</option>
            </select>
          </label>
          <label>
            Source kind
            <select
              name="source_kind"
              defaultValue={v.source_kind || "hr_policy"}
            >
              <option value="hr_policy">HR policy</option>
              <option value="operations_policy">Operations policy</option>
              <option value="informal_note">Informal note</option>
            </select>
          </label>
          <label>
            Reviewed numeric value
            <input name="value" type="number" min="0" max="1000000" required />
          </label>
          <label>
            Population
            <select
              name="population"
              defaultValue={v.population || "india_full_time"}
            >
              <option value="india_full_time">India · full-time</option>
              <option value="india_contractor">India · contractor</option>
            </select>
          </label>
          <label>
            Published on
            <input
              name="published_at"
              type="date"
              defaultValue={v.published_at || ""}
              required
            />
          </label>
          <label>
            Effective from
            <input
              name="valid_from"
              type="date"
              defaultValue={v.valid_from || ""}
              required
            />
          </label>
          <label>
            Effective until (exclusive)
            <input
              name="valid_to"
              type="date"
              defaultValue={v.valid_to || ""}
              disabled={open}
              required={!open}
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={open}
              onChange={(e) => setOpen(e.target.checked)}
            />
            Explicitly open-ended
          </label>
        </div>
        <label>
          Review reason
          <textarea name="reason" minLength={3} maxLength={500} required />
        </label>
        <label className="check-label">
          <input type="checkbox" required />I verified that all sections share
          the document's access permissions.
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        className="button primary"
        disabled={busy || user?.read_only_demo}
      >
        {busy ? "Publishing…" : "Approve and publish"}
      </button>
    </form>
  );
}
export default function DocumentDetail() {
  const { id } = useParams();
  const { user } = useSession();
  const resource = useResource<Detail>("/documents/" + id);
  const epoch = useRef(0);
  const [selected, setSelected] = useState<Version | null>(null),
    [content, setContent] = useState<Content | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [reviewing, setReviewing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [original, setOriginal] = useState(false);
  useEffect(() => {
    const clear = () => {
      epoch.current++;
      setSelected(null);
      setContent(null);
      setReviewing(false);
      setFullscreen(false);
      setOriginal(false);
      setError("");
      setBusy(false);
    };
    clear();
    window.addEventListener("cortex:evidence-changed", clear);
    return () => {
      epoch.current++;
      window.removeEventListener("cortex:evidence-changed", clear);
    };
  }, [id]);
  async function inspect(v: Version) {
    const current = ++epoch.current;
    setBusy(true);
    setError("");
    setContent(null);
    setSelected(v);
    setReviewing(false);
    setOriginal(false);
    try {
      const source = await api<Content>(`/versions/${v.id}/content`);
      if (epoch.current === current) setContent(source);
    } catch (e) {
      if (epoch.current === current) setError((e as Error).message);
    } finally {
      if (epoch.current === current) setBusy(false);
    }
  }
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (user?.read_only_demo || uploading) return;
    setUploading(true);
    setError("");
    try {
      await api(`/documents/${id}/versions`, {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      resource.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  useEffect(() => {
    if (
      !resource.data ||
      resource.loading ||
      resource.data.document.id !== id ||
      selected
    )
      return;
    const version =
      resource.data.versions.find(
        (v) => versionState(v) === "Approved · valid",
      ) || resource.data.versions[0];
    if (version) void inspect(version);
  }, [resource.data, id, resource.loading]);
  return (
    <>
      <Link className="back-link" to="/documents">
        <ArrowLeftIcon size={16} />
        Document library
      </Link>
      <PageHeading
        eyebrow="Document record"
        title={resource.data?.document.title || "Document detail"}
        description="Inspect immutable source versions and their reviewed effective dates."
        action={
          user?.actions.includes("acl.manage") ? (
            <Link className="button" to={"/permissions?document=" + id}>
              <ShieldCheckIcon size={18} />
              Manage access
            </Link>
          ) : undefined
        }
      />
      <State error={resource.error} loading={resource.loading}>
        {resource.data && (
          <div className="detail-grid">
            <section className="version-panel">
              <label className="edition-picker">
                Source edition
                <select
                  value={selected?.id || ""}
                  onChange={(e) => {
                    const v = resource.data?.versions.find(
                      (v) => v.id === e.target.value,
                    );
                    if (v) void inspect(v);
                  }}
                >
                  {resource.data.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.version_label}
                    </option>
                  ))}
                </select>
              </label>
              <details className="panel version-history" open>
                <summary>
                  Version history · {resource.data.versions.length}
                </summary>
                {resource.data.versions.map((v) => (
                  <button
                    className={
                      "version-row " + (selected?.id === v.id ? "selected" : "")
                    }
                    key={v.id}
                    aria-pressed={selected?.id === v.id}
                    onClick={() => void inspect(v)}
                  >
                    <div>
                      <strong>{v.version_label}</strong>
                      <Badge state={versionState(v)} />
                    </div>
                    <span>
                      Effective {v.valid_from || "Not reviewed"} →{" "}
                      {v.valid_to ||
                        (v.valid_from ? "Open-ended" : "Not reviewed")}
                      {v.valid_to ? " (end exclusive)" : ""}
                    </span>
                    <small>
                      Published {v.published_at || "Not reviewed"} · uploaded{" "}
                      {v.ingested_at.slice(0, 10)}
                    </small>
                  </button>
                ))}
              </details>
              {user?.actions.includes("document.upload") && (
                <details className="panel">
                  <summary>Add a version</summary>
                  <form
                    className="version-upload"
                    onSubmit={(e) => void add(e)}
                  >
                    <label>
                      Version label
                      <input name="version_label" required maxLength={80} />
                    </label>
                    <FilePicker disabled={user?.read_only_demo || uploading} />
                    <button
                      className="button"
                      disabled={user?.read_only_demo || uploading}
                    >
                      {uploading ? "Uploading…" : "Upload for review"}
                    </button>
                  </form>
                </details>
              )}
            </section>
            <section className="document-reading">
              <State error={error} loading={busy}>
                {content && selected ? (
                  <>
                    <div className="section-heading">
                      <h2>{selected.version_label}</h2>
                      <a
                        className="button"
                        href={`/api/v1/versions/${selected.id}/download`}
                      >
                        <DownloadSimpleIcon size={18} />
                        Download
                      </a>
                    </div>
                    <div className="document-validity">
                      <Badge state={versionState(selected)} />
                      <span>
                        Effective {selected.valid_from || "Not reviewed"} →{" "}
                        {selected.valid_to ||
                          (selected.valid_from ? "open-ended" : "Not reviewed")}
                        {selected.valid_to ? " (end exclusive)" : ""}
                      </span>
                      <span>
                        {(selected.population
                          ? populationName(selected.population)
                          : null) || "Scope not reviewed"}
                      </span>
                    </div>
                    <p className="reading-label">Immutable source text</p>
                    {content.review && (
                      <details className="source-details">
                        <summary>Approval & authority</summary>
                        <p>
                          {content.review.approval_state} · reviewed by{" "}
                          {content.review.reviewer_name} on{" "}
                          {content.review.reviewed_at} ·{" "}
                          {content.review.source_kind.replaceAll("_", " ")} ·
                          authority rank{" "}
                          {content.review.authority_rank ?? "not configured"}
                        </p>
                      </details>
                    )}
                    {content.original_format && (
                      <p className="section-note">
                        {content.original_format.toUpperCase()} extracted text.
                        Original typography, images, headers and footers are not
                        reproduced.
                      </p>
                    )}
                    {content.original_preview_available && (
                      <button
                        className="button"
                        onClick={() => setOriginal(!original)}
                      >
                        {original
                          ? "Read extracted text"
                          : "View original PDF pages"}
                      </button>
                    )}
                    <button
                      className="button"
                      onClick={async () => {
                        const stamp = ++epoch.current;
                        try {
                          const checked = await api<Content>(
                            `/versions/${selected.id}/content`,
                          );
                          if (epoch.current === stamp) {
                            setContent(checked);
                            setFullscreen(true);
                          }
                        } catch (e) {
                          if (epoch.current === stamp) {
                            window.dispatchEvent(
                              new Event("cortex:evidence-changed"),
                            );
                            setError((e as Error).message);
                          }
                        }
                      }}
                    >
                      Read full screen
                    </button>
                    {!fullscreen && (
                      <Suspense
                        fallback={<p role="status">Opening document reader…</p>}
                      >
                        {original ? (
                          <OriginalPdf
                            versionId={selected.id}
                            onDenied={() => {
                              setContent(null);
                              resource.reload();
                            }}
                          />
                        ) : (
                          <DocumentReader
                            key={selected.id}
                            text={content.text}
                            title={content.title}
                          />
                        )}
                      </Suspense>
                    )}
                    {fullscreen && (
                      <SourceDialog
                        label="Complete authorized document"
                        className="full-document-dialog"
                        onClose={() => setFullscreen(false)}
                      >
                        <button
                          className="button back-link"
                          onClick={() => setFullscreen(false)}
                        >
                          Back to document
                        </button>
                        <h2>{content.title}</h2>
                        <p className="section-note">
                          {selected.version_label} · {versionState(selected)} ·{" "}
                          {selected.source_kind?.replaceAll("_", " ")} ·
                          effective {selected.valid_from} →{" "}
                          {selected.valid_to || "open-ended"}
                          {selected.valid_to ? " (end exclusive)" : ""}
                        </p>
                        <Suspense
                          fallback={
                            <p role="status">Opening document reader…</p>
                          }
                        >
                          <DocumentReader
                            text={content.text}
                            title={content.title}
                          />
                        </Suspense>
                      </SourceDialog>
                    )}
                    <details className="hash-details">
                      <summary>Source integrity</summary>
                      <p>
                        Published {selected.published_at || "not reviewed"} ·
                        uploaded {selected.ingested_at.slice(0, 10)} · metadata
                        revision {selected.metadata_revision}
                      </p>
                      <p>SHA-256 of extracted text</p>
                      <code>{content.source_hash}</code>
                    </details>
                    {user?.actions.includes("document.review") &&
                      content.segments.length > 0 && (
                        <>
                          <button
                            className="button"
                            onClick={() => setReviewing(!reviewing)}
                          >
                            {reviewing ? "Close review" : "Review metadata"}
                          </button>
                          {reviewing && (
                            <SourceDialog
                              label="Review and approve version"
                              onClose={() => setReviewing(false)}
                            >
                              <button
                                className="icon-button dialog-close"
                                aria-label="Close review"
                                onClick={() => setReviewing(false)}
                              >
                                <XIcon size={20} />
                              </button>
                              <ReviewForm
                                v={selected}
                                content={content}
                                done={() => {
                                  setReviewing(false);
                                  setSelected(null);
                                  setContent(null);
                                  resource.reload();
                                }}
                              />
                            </SourceDialog>
                          )}
                        </>
                      )}
                  </>
                ) : (
                  <div className="empty-state">
                    <FileTextIcon size={32} />
                    <h2>Choose a version</h2>
                    <p>Source text and review details appear here.</p>
                  </div>
                )}
              </State>
            </section>
          </div>
        )}
      </State>
    </>
  );
}
