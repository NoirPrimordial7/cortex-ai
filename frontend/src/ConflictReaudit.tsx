import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useSession } from "./session";
import type { Answer } from "./types";

/** Employee escalation is bound to the server's conflict, never a policy picker. */
export function ConflictReaudit({
  answer,
  disabled,
  onSubmitted,
}: {
  answer: Answer;
  disabled: boolean;
  onSubmitted: () => Promise<void>;
}) {
  const { user, refresh } = useSession();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const alive = useRef(true),
    controller = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  if (!user?.actions.includes("ticket.create"))
    return (
      <p className="fb-comparison-note">
        An Employee can send this detected conflict to the Auditor.
      </p>
    );
  const sent = Boolean(answer.re_audit?.subscribed);
  async function send() {
    if (busy || sent) return;
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      await api("/policy-tickets", {
        method: "POST",
        signal: controller.current.signal,
        body: JSON.stringify({ query_id: answer.query_id }),
      });
      if (!alive.current) return;
      // Refresh revisions before re-reading the answer after explicit review grants.
      await refresh();
      await onSubmitted();
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="conflict-reaudit">
      {answer.re_audit?.status === "pending" && (
        <p role="status">
          Sent to Auditor — awaiting a primary policy decision.
        </p>
      )}
      <p className="fb-comparison-note">
        Send the conflicting policy versions and this question directly to the
        Auditor.
      </p>
      <button
        className="button"
        disabled={disabled || busy || sent || user.read_only_demo}
        onClick={() => void send()}
      >
        {busy
          ? "Sending conflict…"
          : sent
            ? "Already sent to Auditor"
            : "Send conflict for re-audit"}
      </button>
      {user.read_only_demo && (
        <p className="section-note">
          Re-audit submission is disabled in this shared read-only demo.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
