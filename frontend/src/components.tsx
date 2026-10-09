import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  WarningCircleIcon,
  SpinnerGapIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import { api } from "./api";
export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const invalidate = () => {
      setData(null);
      setRevision((r) => r + 1);
    };
    window.addEventListener("cortex:evidence-changed", invalidate);
    return () =>
      window.removeEventListener("cortex:evidence-changed", invalidate);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError("");
    api<T>(path, { signal: controller.signal })
      .then((d) => {
        if (!controller.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, loading, reload: () => setRevision((r) => r + 1) };
}
export function SourceDialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    panel?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key !== "Tab" || !panel) return;
      const items = [
        ...panel.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex="0"]',
        ),
      ].filter((x) => !x.hasAttribute("disabled"));
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div className="dialog-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Authorized source"
        className="source-dialog"
      >
        {children}
      </section>
    </div>
  );
}
export function State({
  error,
  loading,
  children,
}: {
  error?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  if (error)
    return (
      <div role="alert" className="state error">
        <WarningCircleIcon size={24} />
        <div>
          <strong>We couldn’t complete this request</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  if (loading)
    return (
      <div role="status" className="state">
        <SpinnerGapIcon className="spin" size={24} />
        <span>Loading your workspace…</span>
      </div>
    );
  return <>{children}</>;
}
export function Badge({ state }: { state: string }) {
  const warning = ["Conflict", "Pending review", "Future effective"].includes(
    state,
  );
  const neutral = ["Expired", "Abstained"].includes(state);
  const failed = ["Failed extraction", "Rejected"].includes(state);
  return (
    <span
      className={
        "badge " +
        (failed ? "failed" : neutral ? "neutral" : warning ? "warning" : "")
      }
    >
      {failed ? (
        <WarningCircleIcon size={14} />
      ) : warning || neutral ? (
        <ClockIcon size={14} />
      ) : (
        <CheckCircleIcon size={14} />
      )}{" "}
      {state}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="description">{description}</p>
      </div>
      {action}
    </header>
  );
}
export function localPolicyDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function versionState(v: {
  approval_state: string | null;
  valid_from: string | null;
  valid_to: string | null;
  extraction_state?: string;
}) {
  const date = localPolicyDate();
  if (v.extraction_state === "failed") return "Failed extraction";
  if (v.approval_state === "rejected") return "Rejected";
  if (v.approval_state !== "approved") return "Pending review";
  if (v.valid_from && v.valid_from > date) return "Future effective";
  if (v.valid_to && v.valid_to <= date) return "Expired";
  return "Approved · valid";
}
