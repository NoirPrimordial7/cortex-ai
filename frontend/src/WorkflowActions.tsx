import { useState, type ReactNode } from "react";
import { api } from "./api";
import { SourceDialog } from "./components";
import { useSession } from "./session";

type Pending = { path: string; body: unknown; label: string; summary: string };

export function useWorkflowActions(
  onSuccess: () => void,
  invalidateEvidence = true,
) {
  const { user } = useSession();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function prepare(
    path: string,
    body: unknown,
    label: string,
    summary: string,
  ) {
    if (user?.read_only_demo) {
      setError("This shared demo is view-only.");
      return;
    }
    setError("");
    setMessage("");
    setPending({ path, body, label, summary });
  }
  async function confirm() {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      await api(pending.path, {
        method: "POST",
        body:
          pending.body instanceof FormData
            ? pending.body
            : JSON.stringify(pending.body),
      });
      setMessage(pending.label + " completed.");
      setPending(null);
      onSuccess();
      if (invalidateEvidence)
        window.dispatchEvent(new Event("cortex:evidence-changed"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const feedback = (
    <>
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      {error && !pending && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {pending && (
        <SourceDialog
          label={pending.label}
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <h2>{pending.label}</h2>
          <p>{pending.summary}</p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="action-row">
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void confirm()}
            >
              {busy ? "Saving…" : "Confirm"}
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
          </div>
        </SourceDialog>
      )}
    </>
  );
  return { prepare, feedback, busy, readOnly: Boolean(user?.read_only_demo) };
}

export function WorkflowPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel workflow-panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
