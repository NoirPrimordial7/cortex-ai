import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useSession } from "../session";
import { PageHeading, State, useResource } from "../components";
import type { DocumentItem } from "../types";
type Person = {
  id: string;
  display_name: string;
  email_normalized: string;
  active: boolean;
  role_ids: string[];
};
type Directory = {
  items: Person[];
  roles: { id: string; name: string }[];
  policy_revision: number;
};
type ACL = {
  grants: { user_id?: string | null; role_id?: string | null }[];
  policy_revision: number;
};
export default function Permissions() {
  const { user } = useSession();
  const [params] = useSearchParams();
  const [did, setDid] = useState(params.get("document") || ""),
    [acl, setAcl] = useState<ACL | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const directory = useResource<Directory>("/admin/users"),
    documents = useResource<{ items: DocumentItem[] }>("/documents");
  useEffect(() => {
    setAcl(null);
    setMessage("");
    setError("");
    if (!did) return;
    const controller = new AbortController();
    api<ACL>(`/admin/documents/${did}/acl`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setAcl(result);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [did]);
  async function update(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!acl) return;
    setBusy(true);
    setMessage("");
    setError("");
    const values = new FormData(e.currentTarget);
    const grants = values.getAll("subjects").map((s) => {
      const [kind, id] = String(s).split(":");
      return kind === "role" ? { role_id: id } : { user_id: id };
    });
    try {
      await api(`/admin/documents/${did}/acl`, {
        method: "PUT",
        body: JSON.stringify({
          expected_policy_revision: acl.policy_revision,
          grants,
        }),
      });
      setAcl(await api<ACL>(`/admin/documents/${did}/acl`));
      directory.reload();
      setMessage(
        "Permissions updated. Subsequent evidence reads use the new grants.",
      );
      window.dispatchEvent(new Event("cortex:evidence-changed"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function changePerson(
    person: Person,
    active: boolean,
    roles: string[],
  ) {
    if (!directory.data) return;
    setError("");
    try {
      await api(`/admin/users/${person.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          active,
          role_ids: roles,
          expected_policy_revision: directory.data.policy_revision,
        }),
      });
      directory.reload();
      window.dispatchEvent(new Event("cortex:evidence-changed"));
      if (did) setAcl(await api<ACL>(`/admin/documents/${did}/acl`));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE GOVERNANCE"
        title="Permissions & people"
        description="Roles permit actions. Explicit document grants control which evidence can be read."
      />
      <State
        error={directory.error || documents.error}
        loading={directory.loading || documents.loading}
      >
        {directory.data && (
          <div className="governance-grid">
            <section className="governance-panel">
              <h2>Document access</h2>
              <label>
                Readable document
                <select value={did} onChange={(e) => setDid(e.target.value)}>
                  <option value="">Choose a document</option>
                  {documents.data?.items.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </label>
              {acl && (
                <form
                  onSubmit={(e) => void update(e)}
                  key={did + acl.policy_revision}
                >
                  <h3>Role grants</h3>
                  {directory.data.roles.map((r) => (
                    <label className="check-label" key={r.id}>
                      <input
                        name="subjects"
                        type="checkbox"
                        value={"role:" + r.id}
                        defaultChecked={acl.grants.some(
                          (g) => g.role_id === r.id,
                        )}
                      />
                      {r.name}
                    </label>
                  ))}
                  <h3>Individual grants</h3>
                  {directory.data.items.map((u) => (
                    <label className="check-label" key={u.id}>
                      <input
                        name="subjects"
                        type="checkbox"
                        value={"user:" + u.id}
                        defaultChecked={acl.grants.some(
                          (g) => g.user_id === u.id,
                        )}
                      />
                      {u.display_name}
                    </label>
                  ))}
                  <p className="subtle">
                    Keep an explicit grant for your governance access. Missing
                    grants deny access.
                  </p>
                  <button className="button primary" disabled={busy}>
                    {busy ? "Updating…" : "Save document grants"}
                  </button>
                </form>
              )}
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              {message && (
                <p role="status" className="success-message">
                  {message}
                </p>
              )}
            </section>
            <section className="governance-panel">
              <h2>Workspace people</h2>
              <p className="description">
                Disable a user to invalidate their access on the next request.
              </p>
              {directory.data.items.map((u) => (
                <div
                  className="person-row"
                  key={u.id + directory.data?.policy_revision}
                >
                  <div>
                    <strong>{u.display_name}</strong>
                    <small>{u.email_normalized}</small>
                    <span>{u.role_ids.join(", ")}</span>
                    {u.id !== user?.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const roles = new FormData(e.currentTarget)
                            .getAll("roles")
                            .map(String);
                          void changePerson(u, u.active, roles);
                        }}
                      >
                        <fieldset>
                          <legend>Action roles</legend>
                          {directory.data?.roles.map((r) => (
                            <label className="check-label" key={r.id}>
                              <input
                                type="checkbox"
                                name="roles"
                                value={r.id}
                                defaultChecked={u.role_ids.includes(r.id)}
                              />
                              {r.name}
                            </label>
                          ))}
                        </fieldset>
                        <button className="button small" type="submit">
                          Save roles
                        </button>
                      </form>
                    )}
                  </div>
                  <button
                    className="button small"
                    disabled={u.id === user?.id}
                    onClick={() => void changePerson(u, !u.active, u.role_ids)}
                  >
                    {u.active ? "Disable" : "Enable"}
                  </button>
                </div>
              ))}
            </section>
          </div>
        )}
      </State>
    </>
  );
}
