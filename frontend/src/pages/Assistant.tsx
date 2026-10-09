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
import { api } from "../api";
import { localPolicyDate } from "../components";
import type { Answer, Citation, Source } from "../types";
import { SourceInspector } from "../SourceInspector";

// A native modal makes the rest of the app inert, traps focus, and handles Escape.
function EvidenceView({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
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
  const [query, setQuery] = useState(""),
    [askedQuery, setAskedQuery] = useState(""),
    [date, setDate] = useState(localPolicyDate()),
    [population, setPopulation] = useState("india_full_time");
  const [answer, setAnswer] = useState<Answer | null>(null),
    [source, setSource] = useState<Source | null>(null),
    [selected, setSelected] = useState<Citation | null>(null);
  const [busy, setBusy] = useState(false),
    [sourceBusy, setSourceBusy] = useState(false),
    [error, setError] = useState("");
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
    epoch = useRef(0),
    sourceEpoch = useRef(0);
  function clear() {
    if (reading.current) reading.current.scrollTop = 0;
    epoch.current++;
    sourceEpoch.current++;
    setSourceBusy(false);
    setAnswer(null);
    setSource(null);
    setSelected(null);
    setError("");
    setEvidenceView(false);
    setInspector(false);
  }
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
      else setInspector(true);
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
      }
    } finally {
      if (sourceEpoch.current === sourceStamp) setSourceBusy(false);
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
      setAskedQuery(prompt);
      if (result.citations[0]) {
        if (!narrow) setInspector(true);
        await inspect(result.citations[0], result);
      }
    } catch (e) {
      if (epoch.current === stamp) {
        setError((e as Error).message);
        setQuery((draft) => draft || prompt);
      }
    } finally {
      setBusy(false);
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
    />
  );
  return (
    <IconContext.Provider value={{ "aria-hidden": true }}>
      <div className="fieldbook">
        <div className="fb-intro">
          <div>
            <BookOpenTextIcon size={20} />
            <span>Offline evidence answers</span>
          </div>
          <span>Policy knowledge at your fingertips</span>
        </div>
        <div
          className={
            "fb-desk " + (!narrow && inspector ? "with-inspector" : "")
          }
        >
          <section className="fb-reading" aria-label="Ask Cortex">
            <div className="fb-controls">
              <label>
                <span className="fb-label">AS OF</span>
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
                <span className="fb-label">POLICY SCOPE</span>
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
                  <option value="india_full_time">India · full-time</option>
                  <option value="india_contractor">India · contractor</option>
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
                  <p className="fb-label">ASK CORTEX</p>
                  <h1>
                    A clear answer.
                    <br />A source you can trust.
                  </h1>
                  <p>
                    Explore the policy that applies to your date and scope.
                    <br className="fb-desktop-break" /> Every supported answer
                    brings its evidence.
                  </p>
                  <div className="fb-suggestions">
                    {[
                      "How many annual leave days do I have?",
                      "How many remote days per week?",
                      "What is my notice period?",
                    ].map((text) => (
                      <button
                        key={text}
                        onClick={() => void send(undefined, text)}
                      >
                        {text}
                        <ArrowRightIcon size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {busy && (
                <div role="status" className="fb-processing">
                  <div className="skeleton long" />
                  <div className="skeleton" />
                  <p>Checking policy access, dates and authority…</p>
                </div>
              )}
              {error && (
                <div role="alert" className="fb-error">
                  <WarningCircleIcon size={22} />
                  <p>{error}</p>
                </div>
              )}
              {answer && (
                <article
                  className={
                    "fb-answer " +
                    (conflict ? "has-conflict " : "") +
                    (answer.answer.length > 360 ? "is-long" : "")
                  }
                >
                  <p className="fb-label">YOUR QUESTION</p>
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
                  <h2>{answer.answer}</h2>
                  <p className="fb-applies">
                    Applies to{" "}
                    {answer.scope.population === "india_full_time"
                      ? "India full-time employees"
                      : "India contractors"}{" "}
                    · as of {answer.as_of}
                  </p>
                  {conflict && (
                    <p className="fb-conflict-note">
                      Both cited policies have the same authority and apply
                      simultaneously. Review both sources before deciding.
                    </p>
                  )}
                  {answer.citations.length > 0 && (
                    <div className="fb-citations">
                      <p className="fb-label">
                        {conflict
                          ? "POLICIES TO REVIEW"
                          : "SUPPORTING EVIDENCE"}
                      </p>
                      {answer.citations.map((c, i) => (
                        <button
                          key={c.id}
                          className={
                            "fb-citation " +
                            (selected?.id === c.id ? "is-selected" : "")
                          }
                          aria-label={`View evidence: ${c.title}`}
                          onClick={() => void inspect(c, answer, true)}
                        >
                          <span className="fb-citation-number">{i + 1}</span>
                          <strong>{c.title}</strong>
                          <span className="fb-citation-action">
                            View evidence
                          </span>
                          <ArrowRightIcon size={18} />
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              )}
            </div>
            <form className="fb-composer" onSubmit={(e) => void send(e)}>
              <label htmlFor="question" className="fb-label">
                {answer ? "ASK A FOLLOW-UP QUESTION" : "YOUR QUESTION"}
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
          </section>
          {!narrow && inspector && (
            <aside
              id="document-inspector"
              className="fb-inspector"
              aria-label="Source evidence"
            >
              <button
                className="fb-inspector-close"
                aria-label="Hide evidence"
                onClick={() => {
                  setInspector(false);
                  inspectorToggle.current?.focus({ preventScroll: true });
                }}
              >
                <XIcon size={19} />
              </button>
              {inspectorContent}
            </aside>
          )}
        </div>
        {narrow && evidenceView && (
          <EvidenceView onClose={() => setEvidenceView(false)}>
            {inspectorContent}
          </EvidenceView>
        )}
      </div>
    </IconContext.Provider>
  );
}
