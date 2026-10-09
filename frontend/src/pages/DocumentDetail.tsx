import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { api } from "../api";
import {
  Badge,
  PageHeading,
  State,
  useResource,
  versionState,
} from "../components";
import { useSession } from "../session";
import type { Content, Detail, Version } from "../types";
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
    [topic, setTopic] = useState("leave"),
    [open, setOpen] = useState(false),
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
    const end = segment.end - (content.text[segment.end - 1] === "\n" ? 1 : 0);
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
              content.segments.find((s) => s.start === Number(e.target.value))!,
            )
          }
        >
          {content.segments.map((s) => (
            <option key={s.start} value={s.start}>
              {s.locator} · {content.text.slice(s.start, s.end).slice(0, 65)}
            </option>
          ))}
        </select>
      </label>
      <blockquote>{content.text.slice(segment.start, segment.end)}</blockquote>
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
          <select name="source_kind">
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
          <select name="population">
            <option value="india_full_time">India · full-time</option>
            <option value="india_contractor">India · contractor</option>
          </select>
        </label>
        <label>
          Published on
          <input name="published_at" type="date" required />
        </label>
        <label>
          Effective from
          <input name="valid_from" type="date" required />
        </label>
        <label>
          Effective until (exclusive)
          <input name="valid_to" type="date" disabled={open} required={!open} />
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
        <input type="checkbox" required />I verified that all sections share the
        document's access permissions.
      </label>
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
    [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    const clear = () => {
      epoch.current++;
      setSelected(null);
      setContent(null);
      setReviewing(false);
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
    if (user?.read_only_demo) return;
    setError("");
    try {
      await api(`/documents/${id}/versions`, {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      resource.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Link className="back-link" to="/documents">
        <ArrowLeftIcon size={16} />
        Document library
      </Link>
      <PageHeading
        eyebrow="DOCUMENT RECORD"
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
              <h2>Version history</h2>
              {resource.data.versions.map((v) => (
                <button
                  className={
                    "version-row " + (selected?.id === v.id ? "selected" : "")
                  }
                  key={v.id}
                  onClick={() => void inspect(v)}
                >
                  <div>
                    <strong>{v.version_label}</strong>
                    <Badge state={versionState(v)} />
                  </div>
                  <span>
                    Effective {v.valid_from || "Not reviewed"} —{" "}
                    {v.valid_to ||
                      (v.valid_from ? "Open-ended" : "Not reviewed")}
                  </span>
                  <small>
                    Published {v.published_at || "Not reviewed"} · uploaded{" "}
                    {v.ingested_at.slice(0, 10)}
                  </small>
                </button>
              ))}
              {user?.actions.includes("document.upload") && (
                <form className="version-upload" onSubmit={(e) => void add(e)}>
                  <h3>Add a version</h3>
                  <label>
                    Version label
                    <input name="version_label" required maxLength={80} />
                  </label>
                  <label>
                    Document file
                    <input
                      name="file"
                      type="file"
                      accept=".txt,.pdf,.docx"
                      required
                    />
                  </label>
                  <button className="button" disabled={user?.read_only_demo}>
                    Upload for review
                  </button>
                </form>
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
                    <pre className="source-text">{content.text}</pre>
                    <details className="hash-details">
                      <summary>Source integrity</summary>
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
