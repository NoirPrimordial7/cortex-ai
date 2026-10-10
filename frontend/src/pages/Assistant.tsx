import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenTextIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  FileTextIcon,
  SidebarSimpleIcon,
  WarningCircleIcon,
  XIcon,
  IconContext,
} from "@phosphor-icons/react";
import { api, ApiError } from "../api";
import { useAskDraft } from "../AskDraft";
import type { Answer, Citation, Source } from "../types";
import { SourceInspector } from "../SourceInspector";

// A native modal makes the rest of the app inert, traps focus, and handles Escape.
function EvidenceView({
  children,
  onClose,
  returnTo,
}: {
  children: ReactNode;
  onClose: () => void;
  returnTo: HTMLElement | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = returnTo || (document.activeElement as HTMLElement | null);
    const overflow = document.body.style.overflow;
    const element = dialog.current!;
    element.showModal();
    document.body.style.overflow = "hidden";
    back.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      className="fb-evidence-view"
      ref={dialog}
      aria-label="Source evidence"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const controls = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href], input, select, textarea, [tabindex='0']",
          ),
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (e.shiftKey && window.document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && window.document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="fb-evidence-back">
        <button ref={back} onClick={onClose}>
          <ArrowLeftIcon size={20} />
          Back to answer
        </button>
        <span>Cortex</span>
      </div>
      {children}
    </dialog>
  );
}

export default function Assistant() {
  const { query, setQuery, date, setDate, population, setPopulation } =
    useAskDraft();
  const [askedQuery, setAskedQuery] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null),
    [source, setSource] = useState<Source | null>(null),
    [selected, setSelected] = useState<Citation | null>(null);
  const [busy, setBusy] = useState(false),
    [sourceBusy, setSourceBusy] = useState(false),
    [error, setError] = useState("");
  const [comparison, setComparison] = useState<Source[]>([]),
    [comparisonBusy, setComparisonBusy] = useState(false),
    [denied, setDenied] = useState(false);
  const [narrow, setNarrow] = useState(
    () =>
      typeof matchMedia === "function" &&
      matchMedia("(max-width: 1099px)").matches,
  );
  const [inspector, setInspector] = useState(false),
    [evidenceView, setEvidenceView] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null),
    reading = useRef<HTMLDivElement>(null),
    inspectorToggle = useRef<HTMLButtonElement>(null),
    inspectorClose = useRef<HTMLButtonElement>(null),
    evidenceReturn = useRef<HTMLElement | null>(null),
    focusInspector = useRef(false),
    epoch = useRef(0),
    sourceEpoch = useRef(0);
  function clear() {
    if (reading.current) reading.current.scrollTop = 0;
    epoch.current++;
    sourceEpoch.current++;
    setBusy(false);
    setSourceBusy(false);
    setComparisonBusy(false);
    setComparison([]);
    setDenied(false);
    setAnswer(null);
    setSource(null);
    setSelected(null);
    setError("");
    setEvidenceView(false);
    setInspector(false);
  }
  useEffect(() => {
    if (inspector && !narrow && focusInspector.current) {
      inspectorClose.current?.focus({ preventScroll: true });
      focusInspector.current = false;
    }
  }, [inspector, narrow, selected?.id]);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const media = matchMedia("(max-width: 1099px)");
    const changed = () => {
      setNarrow(media.matches);
      setEvidenceView(false);
    };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    const reset = () => clear();
    const shortcut = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "k" &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("cortex:evidence-changed", reset);
    window.addEventListener("keydown", shortcut);
    return () => {
      epoch.current++;
      sourceEpoch.current++;
      window.removeEventListener("cortex:evidence-changed", reset);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  async function inspect(c: Citation, q: Answer, open = false) {
    const stamp = epoch.current,
      sourceStamp = ++sourceEpoch.current;
    setSourceBusy(true);
    setSource(null);
    setSelected(c);
    if (open) {
      if (narrow) setEvidenceView(true);
      else {
        focusInspector.current = !inspectorClose.current;
        inspectorClose.current?.focus({ preventScroll: true });
        setInspector(true);
      }
    }
    try {
      const detail = await api<Source>(
        `/queries/${q.query_id}/citations/${c.id}`,
      );
      if (epoch.current === stamp && sourceEpoch.current === sourceStamp)
        setSource(detail);
    } catch (e) {
      if (epoch.current === stamp && sourceEpoch.current === sourceStamp) {
        clear();
        setError((e as Error).message);
        setDenied(e instanceof ApiError && [403, 404, 409].includes(e.status));
      }
    } finally {
      if (sourceEpoch.current === sourceStamp) setSourceBusy(false);
    }
  }
  async function compare(q: Answer) {
    const stamp = epoch.current;
    setComparisonBusy(true);
    try {
      // Do not expose either excerpt until ALL citation reads are authorized.
      const sources = await Promise.all(
        q.citations.map((c) =>
          api<Source>(`/queries/${q.query_id}/citations/${c.id}`),
        ),
      );
      if (epoch.current === stamp) setComparison(sources);
    } catch (e) {
      if (epoch.current === stamp) {
        clear();
        setError((e as Error).message);
        setDenied(e instanceof ApiError && [403, 404, 409].includes(e.status));
      }
    } finally {
      if (epoch.current === stamp) setComparisonBusy(false);
    }
  }
  async function send(e?: FormEvent, example?: string) {
    e?.preventDefault();
    if (busy) return;
    const prompt = (example || query).trim();
    if (!prompt || !date) return;
    clear();
    const stamp = epoch.current;
    setBusy(true);
    setAskedQuery(prompt);
    setQuery("");
    try {
      const result = await api<Answer>("/queries", {
        method: "POST",
        body: JSON.stringify({
          query: prompt,
          as_of: date,
          population,
          jurisdiction: "IN",
        }),
      });
      if (epoch.current !== stamp) return;
      setAnswer(result);
      // The query has completed. Source authorization has its own loading state
      // and failure handling; it must not block the next question's composer.
      setBusy(false);
      if (result.reason_code === "UNRESOLVED_CONFLICT") {
        void compare(result);
      } else if (result.citations[0]) {
        if (!narrow) setInspector(true);
        void inspect(result.citations[0], result);
      }
    } catch (e) {
      if (epoch.current === stamp) {
        setError((e as Error).message);
        setQuery((draft) => draft || prompt);
      }
    } finally {
      if (epoch.current === stamp) setBusy(false);
    }
  }
  const conflict = answer?.reason_code === "UNRESOLVED_CONFLICT";
  const inspectorContent = (
    <SourceInspector
      key={selected?.id || "empty"}
      citation={selected}
      source={source}
      busy={sourceBusy}
      conflict={conflict}
      formatDate={policyDate}
      askFolio={
        selected && answer
          ? answer.citations.findIndex((c) => c.id === selected.id) + 1
          : undefined
      }
      context={
        answer
          ? { date: answer.as_of, population: answer.scope.population }
          : undefined
      }
    />
  );
  return (
    <IconContext.Provider value={{ "aria-hidden": true }}>
      <div
        className={
          "fieldbook" +
          (!answer && !busy && !error ? " is-empty" : "") +
          (conflict ? " is-comparing" : "")
        }
      >
        <div className="fb-intro">
          <p className="fb-title">Ask Cortex</p>
          <div>
            <BookOpenTextIcon size={20} />
            <span>Offline evidence answers</span>
          </div>
        </div>
        <div className="fb-controls">
          <label>
            <span className="fb-label">As of</span>
            <span className="fb-control">
              <CalendarBlankIcon size={18} />
              <input
                aria-label="As of"
                name="as_of"
                autoComplete="off"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  clear();
                }}
                required
              />
            </span>
          </label>
          <label>
            <span className="fb-label">Scope</span>
            <select
              aria-label="Policy scope"
              name="population"
              autoComplete="off"
              value={population}
              onChange={(e) => {
                setPopulation(e.target.value);
                clear();
              }}
            >
              <option value="india_full_time">India full-time</option>
              <option value="india_contractor">India contractor</option>
            </select>
          </label>
          {!narrow && selected && (
            <button
              className="fb-inspector-toggle"
              ref={inspectorToggle}
              aria-expanded={inspector}
              aria-controls="document-inspector"
              onClick={() => setInspector(!inspector)}
            >
              <SidebarSimpleIcon size={19} />
              {inspector ? "Hide evidence" : "Show evidence"}
            </button>
          )}
        </div>
        <div
          className={
            "fb-desk " + (!narrow && inspector ? "with-inspector" : "")
          }
        >
          <section className="fb-reading" aria-label="Ask Cortex">
            <div
              className="fb-result"
              ref={reading}
              role="region"
              aria-label="Policy answer"
              tabIndex={0}
              aria-live="polite"
              aria-busy={busy}
            >
              {!answer && !busy && !error && (
                <div className="fb-empty">
                  <h1>
                    A clear answer.
                    <br />A source you can trust.
                  </h1>
                  <p>
                    Start with a question. Read the answer alongside the exact
                    policy behind it.
                  </p>
                  <div className="fb-empty-proof">
                    <BookOpenTextIcon size={28} />
                    <span>
                      Grounded in your accessible policies.
                      <br />
                      Checked for date, scope and authority.
                    </span>
                  </div>
                </div>
              )}
              {busy && (
                <div role="status" className="fb-processing">
                  <h1 className="question-bubble">{askedQuery}</h1>
                  <div className="skeleton long" />
                  <div className="skeleton" />
                  <p>Checking policy access, dates and authority…</p>
                </div>
              )}
              {error && (
                <div className="fb-failure">
                  <h1>
                    {denied
                      ? "Source unavailable"
                      : "The check could not complete"}
                  </h1>
                  <div role="alert" className="fb-error">
                    <WarningCircleIcon size={22} />
                    <p>{error}</p>
                  </div>
                  <p>
                    {denied
                      ? "The answer and evidence have been cleared. Ask again to check the policies you can currently access."
                      : "Your unfinished question is still below. Try again when the connection is available."}
                  </p>
                </div>
              )}
              {answer && (
                <article
                  className={
                    "fb-answer " +
                    (answer.status !== "answered" ? "has-warning " : "") +
                    (conflict ? "has-conflict " : "") +
                    (answer.answer.length > 360 ? "is-long" : "")
                  }
                >
                  <p className="fb-label">Your question</p>
                  <h1 className="question-bubble">{askedQuery}</h1>
                  <div className="fb-answer-label">
                    {answer.status === "answered" ? (
                      <CheckCircleIcon size={17} />
                    ) : (
                      <WarningCircleIcon size={17} />
                    )}
                    <span>
                      {answer.status === "answered"
                        ? "Supported answer"
                        : conflict
                          ? "Policy conflict"
                          : answer.status === "clarification_required"
                            ? "More context needed"
                            : "Unable to answer"}
                    </span>
                  </div>
                  <h2>
                    {conflict
                      ? answer.citations.length === 2
                        ? "Two policies. No single answer."
                        : "Conflicting policies. No single answer."
                      : answer.answer}
                  </h2>
                  {conflict && <p className="fb-abstention">{answer.answer}</p>}
                  {conflict && (
                    <nav
                      className="comparison-jumps"
                      aria-label="Conflict shortcuts"
                    >
                      <a
                        href="#policy-comparison"
                        onClick={() =>
                          document.getElementById("policy-comparison")?.focus()
                        }
                      >
                        Jump to comparison
                      </a>
                      <a
                        href="#question"
                        onClick={() => input.current?.focus()}
                      >
                        Ask a follow-up
                      </a>
                    </nav>
                  )}
                  <p className="fb-applies">
                    Applies to{" "}
                    {answer.scope.population === "india_full_time"
                      ? "India full-time employees"
                      : "India contractors"}{" "}
                    · as of {policyDate(answer.as_of)}
                  </p>
                  {conflict && (
                    <section
                      className="fb-comparison"
                      id="policy-comparison"
                      tabIndex={-1}
                      aria-label="Compare conflicting policy evidence"
                    >
                      <div className="fb-comparison-heading">
                        <h3>Compare the policy claims</h3>
                        <span>Equal authority · overlapping validity</span>
                      </div>
                      {comparisonBusy && (
                        <p role="status" className="fb-source-loading">
                          {answer.citations.length === 2
                            ? "Checking source access for both policies…"
                            : "Checking source access for all policies…"}
                        </p>
                      )}
                      {comparison.length > 0 && (
                        <div className="fb-comparison-grid">
                          {comparison.map((s, i) => (
                            <article key={s.id} className="fb-claim">
                              <div className="fb-claim-heading">
                                <span className="fb-citation-number">
                                  {i + 1}
                                </span>
                                <h3>{s.title}</h3>
                              </div>
                              <blockquote>
                                {s.text.slice(s.start_char, s.end_char)}
                              </blockquote>
                              <dl>
                                <div>
                                  <dt>Authority</dt>
                                  <dd>
                                    {s.source_kind.replaceAll("_", " ")}
                                    {s.authority_rank !== undefined
                                      ? ` · rank ${s.authority_rank}`
                                      : ""}
                                  </dd>
                                </div>
                                <div>
                                  <dt>Effective</dt>
                                  <dd>
                                    {policyDate(s.valid_from)} to{" "}
                                    {s.valid_to
                                      ? policyDate(s.valid_to) + " (exclusive)"
                                      : "open-ended"}
                                  </dd>
                                </div>
                                <div>
                                  <dt>Passage</dt>
                                  <dd>{s.locator}</dd>
                                </div>
                              </dl>
                              <button
                                className="fb-claim-open"
                                aria-label={`View evidence: ${s.title}`}
                                onClick={(e) => {
                                  evidenceReturn.current = e.currentTarget;
                                  void inspect(s, answer, true);
                                }}
                              >
                                Read full source
                                <ArrowRightIcon size={18} />
                              </button>
                            </article>
                          ))}
                        </div>
                      )}
                      <p className="fb-comparison-note">
                        Ask a policy owner to resolve this disagreement.
                      </p>
                    </section>
                  )}
                  {answer.citations.length > 0 && !conflict && (
                    <div className="fb-citations">
                      <p className="fb-label">Supporting evidence</p>
                      <div className="fb-citation-list">
                        {answer.citations.map((c, i) => (
                          <button
                            key={c.id}
                            className={
                              "fb-citation " +
                              (selected?.id === c.id ? "is-selected" : "")
                            }
                            aria-label={`View evidence: ${c.title}`}
                            onClick={(e) => {
                              evidenceReturn.current = e.currentTarget;
                              void inspect(c, answer, true);
                            }}
                          >
                            <span className="fb-citation-number">{i + 1}</span>
                            <span className="fb-citation-copy">
                              <strong>{c.title}</strong>
                              <span>
                                {c.locator} · from {policyDate(c.valid_from)}
                              </span>
                            </span>
                            <span className="fb-citation-action">
                              View evidence
                            </span>
                            <ArrowRightIcon size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )}
            </div>
            <form className="fb-composer" onSubmit={(e) => void send(e)}>
              <label htmlFor="question" className="fb-label">
                {answer ? "Ask a follow-up question" : "Your question"}
              </label>
              <div className="fb-compose-input">
                <textarea
                  id="question"
                  aria-label="Ask about a company policy"
                  name="query"
                  autoComplete="off"
                  ref={input}
                  maxLength={1000}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    answer
                      ? "Ask another policy question…"
                      : "Ask about a company policy…"
                  }
                  rows={2}
                  required
                />
                <button type="submit" disabled={busy || !query.trim() || !date}>
                  {busy ? "Checking…" : "Ask Cortex"}
                  <ArrowRightIcon size={20} />
                </button>
              </div>
              <p>
                Each question checks the selected date and scope.
                <kbd>Ctrl / ⌘ K</kbd>
              </p>
            </form>
            {!answer && !busy && !error && (
              <div className="fb-examples">
                <p>Try a policy question</p>
                <div className="fb-suggestions">
                  {[
                    "How many annual leave days do I have?",
                    "How many remote days per week?",
                    "What is my notice period?",
                  ].map((text, i) => (
                    <button
                      key={text}
                      aria-label={text}
                      onClick={() => void send(undefined, text)}
                    >
                      <span>
                        <strong>
                          {["Annual leave", "Remote work", "Notice period"][i]}
                        </strong>
                        <span>{text}</span>
                      </span>
                      <ArrowRightIcon size={18} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
          {!narrow && inspector && (
            <aside
              id="document-inspector"
              className="fb-inspector"
              aria-label="Source evidence"
            >
              <button
                ref={inspectorClose}
                className="fb-inspector-close"
                aria-label="Hide evidence"
                onClick={() => {
                  setInspector(false);
                  const target = evidenceReturn.current?.isConnected
                    ? evidenceReturn.current
                    : inspectorToggle.current;
                  target?.focus({ preventScroll: true });
                }}
              >
                <XIcon size={19} />
              </button>
              {inspectorContent}
            </aside>
          )}
        </div>
        {narrow && evidenceView && (
          <EvidenceView
            returnTo={evidenceReturn.current}
            onClose={() => setEvidenceView(false)}
          >
            {inspectorContent}
          </EvidenceView>
        )}
      </div>
    </IconContext.Provider>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
function policyDate(value: string) {
  return dateFormat.format(new Date(value.slice(0, 10) + "T00:00:00Z"));
}
