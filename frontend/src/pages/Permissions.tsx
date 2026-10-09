import { readableName } from "../labels";
import { ResponsiveTable } from "../FormPrimitives";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { XIcon } from "@phosphor-icons/react";
import { api } from "../api";
import { useSession } from "../session";
import {
  Badge,
  PageHeading,
  SourceDialog,
  State,
  useResource,
} from "../components";
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
type Grant = { user_id?: string | null; role_id?: string | null };
type ACL = { grants: Grant[]; policy_revision: number };
type Pending =
  | {
      kind: "person";
      person: Person;
      active: boolean;
      roles: string[];
      revision: number;
    }
  | {
      kind: "grants";
      document: string;
      title: string;
      before: string[];
      after: string[];
      revision: number;
    };
function key(g: Grant) {
  return g.role_id ? "role:" + g.role_id : "user:" + g.user_id;
}
export default function Permissions() {
  const { user } = useSession();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("document") ? "access" : "people"),
    [did, setDid] = useState(params.get("document") || ""),
    [acl, setAcl] = useState<ACL | null>(null),
    [subjects, setSubjects] = useState<string[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<Person | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [active, setActive] = useState(true),
    [roles, setRoles] = useState<string[]>([]);
  const directory = useResource<Directory>("/admin/users"),
    documents = useResource<{ items: DocumentItem[] }>("/documents");
  const readOnly = Boolean(user?.read_only_demo);
  useEffect(() => {
    setAcl(null);
    setSubjects([]);
    setError("");
    setPending(null);
    if (!did) return;
    const abort = new AbortController();
    api<ACL>(`/admin/documents/${did}/acl`, { signal: abort.signal })
      .then((result) => {
        if (!abort.signal.aborted) {
          setAcl(result);
          setSubjects(result.grants.map(key));
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [did, directory.data?.policy_revision]);
  useEffect(() => {
    const clear = () => {
      setEditing(null);
      setPending(null);
    };
    window.addEventListener("cortex:evidence-changed", clear);
    return () => window.removeEventListener("cortex:evidence-changed", clear);
  }, []);
  const names = new Map<string, string>([
    ...(directory.data?.roles.map(
      (r) => ["role:" + r.id, readableName(r.name)] as [string, string],
    ) || []),
    ...(directory.data?.items.map(
      (p) => ["user:" + p.id, p.display_name] as [string, string],
    ) || []),
  ]);
  function toggle(values: string[], id: string) {
    return values.includes(id)
      ? values.filter((v) => v !== id)
      : [...values, id];
  }
  function edit(person: Person) {
    setError("");
    setMessage("");
    setEditing(person);
    setActive(person.active);
    setRoles([...person.role_ids]);
  }
  function reviewPerson(e: FormEvent) {
    e.preventDefault();
    if (!editing || !directory.data || readOnly) return;
    setPending({
      kind: "person",
      person: editing,
      active,
      roles: [...roles],
      revision: directory.data.policy_revision,
    });
    setEditing(null);
  }
  function reviewGrants(e: FormEvent) {
    e.preventDefault();
    if (!acl || readOnly) return;
    setPending({
      kind: "grants",
      document: did,
      title:
        documents.data?.items.find((d) => d.id === did)?.title ||
        "Selected document",
      before: acl.grants.map(key),
      after: [...subjects],
      revision: acl.policy_revision,
    });
  }
  async function confirm() {
    if (!pending || readOnly || busy) return;
    const change = pending;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (change.kind === "person")
        await api(`/admin/users/${change.person.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            active: change.active,
            role_ids: change.roles,
            expected_policy_revision: change.revision,
          }),
        });
      else
        await api(`/admin/documents/${change.document}/acl`, {
          method: "PUT",
          body: JSON.stringify({
            expected_policy_revision: change.revision,
            grants: change.after.map((s) => {
              const [kind, id] = s.split(":");
              return kind === "role" ? { role_id: id } : { user_id: id };
            }),
          }),
        });
      setPending(null);
      setMessage(
        change.kind === "person"
          ? "Account changes saved. Access is rechecked on the next request."
          : "Document grants saved. Evidence reads now use the updated grants.",
      );
      window.dispatchEvent(new Event("cortex:evidence-changed"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const changed =
    Boolean(acl) &&
    (subjects.length !== acl!.grants.length ||
      subjects.some((s) => !acl!.grants.some((g) => key(g) === s)));
  return (
    <>
      <PageHeading
        eyebrow="Governance"
        title="Permissions & people"
        description="Action roles control what people can do. Document grants control the evidence they can read."
      />
      {readOnly && (
        <p className="read-only-note">
          View-only shared demo. People, roles and document grants cannot be
          changed here.
        </p>
      )}
      <div className="section-tabs" aria-label="Governance views">
        <button
          className={tab === "people" ? "active" : ""}
          aria-pressed={tab === "people"}
          onClick={() => setTab("people")}
        >
          Workspace people
        </button>
        <button
          className={tab === "access" ? "active" : ""}
          aria-pressed={tab === "access"}
          onClick={() => setTab("access")}
        >
          Document access
        </button>
      </div>
      {error && !pending && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      <State
        error={directory.error || documents.error}
        loading={directory.loading || documents.loading}
      >
        {directory.data &&
          (tab === "people" ? (
            <section className="library">
              <div className="people-intro">
                <h2>Workspace people</h2>
                <p className="section-note">
                  Review a person’s roles or account status before confirming a
                  change. Your own account is protected from editing.
                </p>
              </div>
              <ResponsiveTable
                className="people-table"
                caption="Workspace people and their action roles"
              >
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Action roles</th>
                    <th>Account</th>
                    <th>
                      <span className="sr-only">Edit person</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {directory.data.items.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.display_name}</strong>
                        <small className="person-email">
                          {p.email_normalized}
                        </small>
                      </td>
                      <td data-label="Roles">
                        {p.role_ids
                          .map((id) =>
                            directory.data!.roles.find((r) => r.id === id)?.name
                              ? readableName(
                                  directory.data!.roles.find(
                                    (r) => r.id === id,
                                  )!.name,
                                )
                              : readableName(id),
                          )
                          .join(", ") || "No action roles"}
                      </td>
                      <td data-label="Account">
                        <Badge state={p.active ? "Active" : "Disabled"} />
                      </td>
                      <td>
                        <button
                          className="button"
                          aria-label={
                            (readOnly ? "View roles for " : "Edit ") +
                            p.display_name
                          }
                          disabled={p.id === user?.id}
                          onClick={() => edit(p)}
                        >
                          {p.id === user?.id
                            ? "Your account"
                            : readOnly
                              ? "View roles"
                              : "Edit access"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResponsiveTable>
            </section>
          ) : (
            <section className="panel grants-panel">
              <div className="section-heading">
                <h2>Document access</h2>
              </div>
              <label>
                Readable document
                <select
                  value={did}
                  onChange={(e) => {
                    setDid(e.target.value);
                    setMessage("");
                  }}
                >
                  <option value="">Choose a document</option>
                  {documents.data?.items.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </label>
              {did && !acl && !error && <State loading />}
              {!did && (
                <p className="section-note">
                  Choose a permitted document to inspect its role and individual
                  grants.
                </p>
              )}
              {acl && (
                <form onSubmit={reviewGrants}>
                  <fieldset disabled={readOnly || busy} className="grants-grid">
                    <div>
                      <h3>Role grants</h3>
                      <p className="section-note">
                        Everyone with a checked role can read this document.
                      </p>
                      {directory.data.roles.map((r) => (
                        <label className="check-label" key={r.id}>
                          <input
                            type="checkbox"
                            checked={subjects.includes("role:" + r.id)}
                            onChange={() =>
                              setSubjects(toggle(subjects, "role:" + r.id))
                            }
                          />
                          {readableName(r.name)}
                        </label>
                      ))}
                    </div>
                    <div>
                      <h3>Individual grants</h3>
                      <p className="section-note">
                        Direct access in addition to role grants.
                      </p>
                      {directory.data.items.map((p) => (
                        <label className="check-label" key={p.id}>
                          <input
                            type="checkbox"
                            checked={subjects.includes("user:" + p.id)}
                            onChange={() =>
                              setSubjects(toggle(subjects, "user:" + p.id))
                            }
                          />
                          <span>
                            {p.display_name}
                            {!p.active && <small> · disabled account</small>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="grant-actions">
                    <p className="subtle">
                      {changed
                        ? "Unsaved grant changes. Review the added and removed access before saving."
                        : "Grants match the current policy revision."}{" "}
                      Keep an explicit grant for your own governance access.
                    </p>
                    <button
                      className="button primary"
                      disabled={!changed || readOnly || busy}
                    >
                      Review grant changes
                    </button>
                  </div>
                </form>
              )}
            </section>
          ))}
      </State>
      {editing && (
        <SourceDialog
          label={"Edit access for " + editing.display_name}
          onClose={() => setEditing(null)}
        >
          <div className="section-heading">
            <h2>{editing.display_name}</h2>
            <button
              className="icon-button"
              aria-label="Close person editor"
              onClick={() => setEditing(null)}
            >
              <XIcon size={20} />
            </button>
          </div>
          <p className="section-note">{editing.email_normalized}</p>
          <form onSubmit={reviewPerson}>
            <fieldset disabled={readOnly}>
              <legend>Action roles</legend>
              {directory.data?.roles.map((r) => (
                <label className="check-label" key={r.id}>
                  <input
                    type="checkbox"
                    checked={roles.includes(r.id)}
                    onChange={() => setRoles(toggle(roles, r.id))}
                  />
                  {readableName(r.name)}
                </label>
              ))}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Account is active
              </label>
            </fieldset>
            <p className="subtle">
              Disabling this account denies subsequent requests. Roles do not
              grant document access by themselves.
            </p>
            {!readOnly && (
              <button
                className="button primary"
                disabled={
                  active === editing.active &&
                  roles.length === editing.role_ids.length &&
                  roles.every((id) => editing.role_ids.includes(id))
                }
              >
                Review account changes
              </button>
            )}
          </form>
        </SourceDialog>
      )}
      {pending && (
        <SourceDialog
          label="Confirm access changes"
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <div className="section-heading">
            <h2>Review access changes</h2>
            <button
              className="icon-button"
              disabled={busy}
              aria-label="Close change review"
              onClick={() => setPending(null)}
            >
              <XIcon size={20} />
            </button>
          </div>
          <p>
            {pending.kind === "person"
              ? pending.person.display_name
              : pending.title}
          </p>
          {pending.kind === "person" ? (
            <>
              <p>
                Account:{" "}
                <strong>
                  {pending.person.active ? "Active" : "Disabled"} →{" "}
                  {pending.active ? "Active" : "Disabled"}
                </strong>
              </p>
              <ChangeList
                title="Roles added"
                items={pending.roles
                  .filter((id) => !pending.person.role_ids.includes(id))
                  .map((id) => names.get("role:" + id) || id)}
              />
              <ChangeList
                title="Roles removed"
                items={pending.person.role_ids
                  .filter((id) => !pending.roles.includes(id))
                  .map((id) => names.get("role:" + id) || id)}
              />
            </>
          ) : (
            <>
              <ChangeList
                title="Access added"
                items={pending.after
                  .filter((id) => !pending.before.includes(id))
                  .map((id) => names.get(id) || id)}
              />
              <ChangeList
                title="Access removed"
                items={pending.before
                  .filter((id) => !pending.after.includes(id))
                  .map((id) => names.get(id) || id)}
              />
            </>
          )}
          <p className="section-note">
            This changes access immediately on subsequent requests. The server
            will reject stale policy revisions.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="action-row">
            <button
              className="button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Cancel changes
            </button>
            <button
              className="button primary"
              disabled={busy || readOnly}
              onClick={() => void confirm()}
            >
              {busy ? "Saving…" : "Confirm access changes"}
            </button>
          </div>
        </SourceDialog>
      )}
    </>
  );
}
function ChangeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="change-list">
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="subtle">None</p>
      )}
    </div>
  );
}
