import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpIcon,
  ArrowSquareOutIcon,
  BookOpenTextIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  QuotesIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { api } from "../api";
import { Badge, localPolicyDate, PageHeading } from "../components";
import type { Answer, Citation, Source } from "../types";
export function HighlightedSource({ source }: { source: Source }) {
  return (
    <pre className="source-text">
      {source.text.slice(0, source.start_char)}
      <mark>{source.text.slice(source.start_char, source.end_char)}</mark>
      {source.text.slice(source.end_char)}
    </pre>
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
  const input = useRef<HTMLTextAreaElement>(null),
    epoch = useRef(0),
    sourceEpoch = useRef(0);
  function clear() {
    epoch.current++;
    sourceEpoch.current++;
    setSourceBusy(false);
    setAnswer(null);
    setSource(null);
    setSelected(null);
    setError("");
  }
  useEffect(() => {
    const reset = () => clear();
    const shortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("cortex:evidence-changed", reset);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("cortex:evidence-changed", reset);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  async function inspect(c: Citation, q: Answer) {
    const stamp = epoch.current;
    const sourceStamp = ++sourceEpoch.current;
    setSourceBusy(true);
    setSource(null);
    setSelected(c);
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
    const prompt = example || query;
    if (!prompt.trim()) return;
    clear();
    const stamp = epoch.current;
    setBusy(true);
    setQuery(prompt);
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
      if (result.citations[0]) await inspect(result.citations[0], result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const examples = [
    "How many annual leave days do I have?",
    "How many remote days per week?",
    "What is my notice period?",
  ];
  return (
    <div className="assistant-page">
      <PageHeading
        eyebrow="EVIDENCE STUDIO"
        title="Knowledge assistant"
        description="Ask a question. Follow the evidence."
        action={
          <span className="mode-label">
            <CheckCircleIcon size={16} /> Offline evidence answers
          </span>
        }
      />
      <div className="studio">
        <section className="conversation">
          <div className="scope-bar">
            <CalendarBlankIcon size={18} />
            <label>
              As of
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  clear();
                }}
                required
              />
            </label>
            <label>
              Policy scope
              <select
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
          </div>
          <div className="conversation-body" aria-live="polite">
            {!answer && !busy && !error && (
              <div className="assistant-empty">
                <BookOpenTextIcon size={38} weight="light" />
                <p className="eyebrow">A BETTER PLACE TO ASK</p>
                <h2>
                  What would you like
                  <br />
                  to understand?
                </h2>
                <p>
                  Explore approved policies for your date and scope.
                  <br />
                  Every supported answer brings its source.
                </p>
                <div className="suggestions">
                  {examples.map((text) => (
                    <button
                      key={text}
                      onClick={() => void send(undefined, text)}
                    >
                      {text}
                      <ArrowSquareOutIcon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {busy && (
              <div className="processing" role="status">
                <div className="skeleton long" />
                <div className="skeleton" />
                <p>
                  Checking permitted evidence, validity and policy authority…
                </p>
              </div>
            )}
            {error && (
              <div role="alert" className="state error">
                <WarningCircleIcon size={24} />
                <p>{error}</p>
              </div>
            )}
            {answer && (
              <>
                <div className="question-bubble">{askedQuery}</div>
                <article
                  className={
                    "answer-block " +
                    (answer.status === "answered" ? "" : "abstention")
                  }
                >
                  <div className="answer-label">
                    {answer.status === "answered" ? (
                      <CheckCircleIcon size={18} />
                    ) : (
                      <WarningCircleIcon size={18} />
                    )}
                    <span>
                      {answer.status === "answered"
                        ? "Evidence answer"
                        : answer.reason_code === "UNRESOLVED_CONFLICT"
                          ? "Policy conflict"
                          : "Unable to answer"}
                    </span>
                    <span className="answer-date">{answer.as_of}</span>
                  </div>
                  <h2>{answer.answer}</h2>
                  <p className="answer-scope">
                    Applies to{" "}
                    {answer.scope.population === "india_full_time"
                      ? "India full-time employees"
                      : "India contractors"}{" "}
                    · effective-time question
                  </p>
                  {answer.citations.length > 0 && (
                    <div className="citation-list">
                      {answer.citations.map((c, i) => (
                        <button
                          className={
                            "citation " +
                            (selected?.id === c.id ? "selected" : "")
                          }
                          key={c.id}
                          onClick={() => void inspect(c, answer)}
                        >
                          <span className="citation-number">{i + 1}</span>
                          <span>
                            <strong>{c.title}</strong>
                            <small>
                              {c.version_id} · {c.locator}
                            </small>
                          </span>
                          <ArrowSquareOutIcon size={18} />
                        </button>
                      ))}
                    </div>
                  )}
                  {answer.reason_code === "UNRESOLVED_CONFLICT" && (
                    <p className="conflict-note">
                      Both cited policies have the same authority and apply
                      simultaneously. Review the evidence before deciding.
                    </p>
                  )}
                </article>
              </>
            )}
          </div>
          <form className="composer" onSubmit={(e) => void send(e)}>
            <label className="sr-only" htmlFor="question">
              Ask about a company policy
            </label>
            <textarea
              id="question"
              ref={input}
              maxLength={1000}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about a company policy…"
              rows={2}
              required
            />
            <div>
              <span>Sources first. Answers when supported.</span>
              <button
                className="button primary send"
                aria-label="Ask Cortex"
                disabled={busy || !query.trim() || !date}
              >
                <ArrowUpIcon size={20} />
              </button>
            </div>
          </form>
        </section>
        <aside
          className={"evidence-workspace " + (selected ? "is-open" : "")}
          aria-label="Source evidence"
        >
          <div className="evidence-header">
            <div>
              <p className="eyebrow">THE SOURCE OF THE ANSWER</p>
              <h2>Evidence</h2>
            </div>
            {selected && (
              <button
                className="icon-button mobile-only"
                aria-label="Close evidence"
                onClick={() => setSelected(null)}
              >
                <XIcon size={20} />
              </button>
            )}
          </div>
          {!selected ? (
            <div className="evidence-empty">
              <QuotesIcon size={32} weight="light" />
              <h3>Keep the source in sight.</h3>
              <p>
                Approved evidence, exact passages and effective dates will
                appear here with your answer.
              </p>
            </div>
          ) : (
            <>
              <div className="source-meta">
                <Badge
                  state={
                    answer?.reason_code === "UNRESOLVED_CONFLICT"
                      ? "Conflict"
                      : "Approved · valid"
                  }
                />
                <h3>{selected.title}</h3>
                <dl>
                  <div>
                    <dt>Version</dt>
                    <dd>{selected.version_id}</dd>
                  </div>
                  <div>
                    <dt>Effective</dt>
                    <dd>
                      {selected.valid_from} —{" "}
                      {selected.valid_to || "Open-ended"}
                    </dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{selected.locator}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>
                      {selected.source_kind === "hr_policy"
                        ? "HR policy"
                        : selected.source_kind === "operations_policy"
                          ? "Operations policy"
                          : "Informal note"}
                    </dd>
                  </div>
                  {selected.authority_rank !== undefined && (
                    <div>
                      <dt>Reviewed authority</dt>
                      <dd>Rank {selected.authority_rank}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="source-reading">
                <p className="eyebrow">EXACT AUTHORIZED PASSAGE</p>
                {sourceBusy ? (
                  <div role="status" className="skeleton long" />
                ) : (
                  source && <HighlightedSource source={source} />
                )}
              </div>
              <div className="source-integrity">
                <CheckCircleIcon size={16} />
                <span>Source span and hash checked by the backend.</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
