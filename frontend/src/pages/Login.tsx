import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  LockKeyIcon,
  CirclesThreePlusIcon,
} from "@phosphor-icons/react";
import { api } from "../api";
import { useSession } from "../session";
export default function Login() {
  const formRef = useRef<HTMLFormElement>(null);
  const [profiles, setProfiles] = useState<
    {
      key: string;
      label: string;
      workspace: string;
      email: string;
      password: string;
      active: boolean;
    }[]
  >([]);
  const [selected, setSelected] = useState("");
  const [demoError, setDemoError] = useState(false);
  async function loadProfiles(signal?: AbortSignal) {
    setDemoError(false);
    try {
      const data = await api<{ items: typeof profiles }>("/demo/accounts", {
        signal,
      });
      if (!signal?.aborted) setProfiles(data.items);
    } catch {
      if (!signal?.aborted) setDemoError(true);
    }
  }
  useEffect(() => {
    const abort = new AbortController();
    void loadProfiles(abort.signal);
    return () => abort.abort();
  }, []);
  function fill(profile: (typeof profiles)[number]) {
    const form = formRef.current;
    if (!form) return;
    for (const field of ["workspace", "email", "password"] as const) {
      const input = form.elements.namedItem(field) as HTMLInputElement;
      input.value = profile[field];
    }
    setSelected(profile.label);
    setError("");
    (form.elements.namedItem("email") as HTMLInputElement).focus();
  }
  const { refresh } = useSession();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          <CirclesThreePlusIcon size={28} weight="duotone" />
          <span>
            cortex<span className="brand-ai">AI</span>
          </span>
        </div>
        <div>
          <p className="eyebrow">KNOWLEDGE, WITH CONTEXT</p>
          <h1>
            A clear answer.
            <br />
            The evidence
            <br />
            to trust it.
          </h1>
          <p>
            Find the policy that applies, understand its source, and see when
            the evidence disagrees.
          </p>
          <div className="login-proof">
            <BookOpenTextIcon size={24} />
            <span>
              Sources, versions and effective dates.
              <br />
              Together in one workspace.
            </span>
          </div>
        </div>
        <small>Evidence Studio · fictional demonstration</small>
      </section>
      <section className="login-form">
        <form ref={formRef} onSubmit={submit}>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>Welcome to Cortex.</h2>
          <p className="description">
            Sign in to the knowledge you’re permitted to read.
          </p>
          {demoError && (
            <div className="demo-accounts">
              <p>
                The demo backend may be waking up. Wait a moment, then retry
                loading accounts.
              </p>
              <button
                type="button"
                className="button small"
                onClick={() => void loadProfiles()}
              >
                Load demo accounts
              </button>
            </div>
          )}
          {profiles.length > 0 && (
            <section className="demo-accounts" aria-label="Demo account picker">
              <strong>Try a demo account</strong>
              <p>
                Fictional accounts only. Choose a profile, then sign in. Shared
                profiles share their demo history.
              </p>
              <div>
                {profiles.map((profile) => (
                  <button
                    type="button"
                    className={
                      "demo-account " +
                      (selected === profile.label ? "selected" : "")
                    }
                    aria-pressed={selected === profile.label}
                    key={profile.key}
                    disabled={busy}
                    onClick={() => fill(profile)}
                  >
                    {profile.label}
                    {!profile.active && <small>Expected sign-in denial</small>}
                  </button>
                ))}
              </div>
              {selected && (
                <span role="status">Filled {selected}. Ready to sign in.</span>
              )}
            </section>
          )}
          <label>
            Workspace
            <input
              name="workspace"
              defaultValue="NORTHSTAR"
              autoComplete="organization"
              required
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.test"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Signing in…" : "Enter your workspace"}
            <ArrowRightIcon size={18} />
          </button>
          <p className="login-note">
            <LockKeyIcon size={16} /> Access follows your current document
            permissions.
          </p>
        </form>
      </section>
    </main>
  );
}
