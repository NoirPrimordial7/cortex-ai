import { useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  LockKeyIcon,
  CirclesThreePlusIcon,
} from "@phosphor-icons/react";
import { api } from "../api";
import { useSession } from "../session";
export default function Login() {
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
        <small>Evidence Studio · local fictional demonstration</small>
      </section>
      <section className="login-form">
        <form onSubmit={submit}>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>Welcome to Cortex.</h2>
          <p className="description">
            Sign in to the knowledge you’re permitted to read.
          </p>
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
