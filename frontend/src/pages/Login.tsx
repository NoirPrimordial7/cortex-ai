import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  LockKeyIcon,
  CirclesThreePlusIcon,
} from "@phosphor-icons/react";
import { api, ApiError } from "../api";
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
  const [selectedDisabled, setSelectedDisabled] = useState(false);
  const [demoError, setDemoError] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(true);
  async function loadProfiles(signal?: AbortSignal) {
    setDemoError(false);
    setProfilesLoading(true);
    try {
      const data = await api<{ items: typeof profiles }>("/demo/accounts", {
        signal,
      });
      if (!signal?.aborted) setProfiles(data.items);
    } catch {
      if (!signal?.aborted) setDemoError(true);
    } finally {
      if (!signal?.aborted) setProfilesLoading(false);
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
    setSelectedDisabled(!profile.active);
    setError("");
    setOriginDenied(false);
    (form.elements.namedItem("email") as HTMLInputElement).focus();
  }
  const { refresh } = useSession();
  const [error, setError] = useState(""),
    [originDenied, setOriginDenied] = useState(false),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setOriginDenied(false);
    try {
      await api("/auth/login", {
        method: "POST",
        signal: AbortSignal.timeout(90000),
        body: JSON.stringify(Object.fromEntries(form)),
      });
      await refresh(true);
    } catch (e) {
      const blockedOrigin =
        e instanceof ApiError &&
        e.status === 403 &&
        e.message === "Origin not permitted";
      setOriginDenied(blockedOrigin);
      setError(
        blockedOrigin
          ? "This review address is not approved for sign-in by the shared backend. Open the published demo below, or ask the workspace owner to approve this exact review address."
          : e instanceof DOMException && e.name === "TimeoutError"
            ? "The sign-in service is taking too long to respond. Wait a moment, then retry."
            : e instanceof TypeError
              ? "The sign-in service could not be reached. Wait a moment, then try again. Your details are still here."
              : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          <span>Cortex</span>
        </div>
        <div>
          <p className="eyebrow">KNOWLEDGE, WITH CONTEXT</p>
          <p className="login-statement">
            Policy knowledge,
            <br />
            with its evidence.
          </p>
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
          <h1>Welcome to Cortex.</h1>
          <p className="description">
            Sign in to the knowledge you’re permitted to read.
          </p>
          {profilesLoading && (
            <p role="status" className="login-service-status">
              Connecting to the demo service… The free backend may take a moment
              to wake up.
            </p>
          )}
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
                Choose a fictional profile to explore its role and permitted
                documents.
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
                    data-testid={"demo-profile-" + profile.key}
                    disabled={busy}
                    onClick={() => fill(profile)}
                  >
                    {profile.label}
                    {!profile.active && <small>Expected sign-in denial</small>}
                  </button>
                ))}
              </div>
              {selected && (
                <span role="status">
                  {selectedDisabled
                    ? "This account is disabled. Signing in demonstrates an access denial."
                    : `Filled ${selected}. Ready to sign in.`}
                </span>
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
              spellCheck={false}
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
            <div className="login-error-state">
              <p role="alert" className="form-error">
                {error}
              </p>
              {originDenied && (
                <a
                  className="button"
                  href="https://cortex-ai-three-kappa.vercel.app/"
                >
                  Open approved published demo
                </a>
              )}
              {profiles.length > 0 && !selectedDisabled && !originDenied && (
                <>
                  <p className="section-note">
                    Shared demo details can reset when the backend restarts.
                    Reload the profiles, choose your profile again, then retry.
                  </p>
                  <button
                    type="button"
                    className="button"
                    disabled={profilesLoading}
                    onClick={() => void loadProfiles()}
                  >
                    Reload demo accounts
                  </button>
                </>
              )}
            </div>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Signing in…" : "Enter your workspace"}
            <ArrowRightIcon size={18} />
          </button>
          {busy && (
            <p role="status" className="login-service-status">
              Connecting securely… Keep this page open while the backend
              responds.
            </p>
          )}
          <p className="login-note">
            <LockKeyIcon size={16} /> Access follows your current document
            permissions.
          </p>
        </form>
      </section>
    </main>
  );
}
