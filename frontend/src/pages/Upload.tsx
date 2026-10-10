import { FormField } from "../FormPrimitives";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UploadSimpleIcon } from "@phosphor-icons/react";
import { FilePicker } from "../FilePicker";
import { api } from "../api";
import { useSession } from "../session";
import { PageHeading } from "../components";
export default function Upload() {
  const { user } = useSession();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (user?.read_only_demo) return;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ document_id: string; state: string }>(
        "/documents",
        { method: "POST", body: new FormData(e.currentTarget) },
      );
      if (data.state === "failed") {
        setError(
          "Extraction failed or the format is unsupported. The file is not searchable.",
        );
        return;
      }
      navigate("/documents/" + data.document_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ADD TO YOUR KNOWLEDGE"
        title="Upload a document"
        description="New files stay private and outside answers until reviewed and approved."
      />
      <div className="upload-workbench">
        <form className="upload-form" onSubmit={(e) => void submit(e)}>
          <fieldset
            disabled={busy || user?.read_only_demo}
            className="upload-fields"
          >
            <div className="upload-intro">
              <UploadSimpleIcon size={24} />
              <h2>Start with the source</h2>
              <p>Choose a file, then give the document a clear name.</p>
            </div>
            <FilePicker disabled={busy || user?.read_only_demo} />
            <div className="form-grid">
              <FormField label="Document title">
                <input
                  name="title"
                  maxLength={200}
                  placeholder="A clear policy title"
                  required
                />
              </FormField>
              <FormField label="Category">
                <select name="category">
                  <option value="policy">Policy</option>
                  <option value="SOP">SOP</option>
                  <option value="project">Project</option>
                </select>
              </FormField>
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button
            className="button primary"
            disabled={busy || user?.read_only_demo}
          >
            {busy ? "Extracting document…" : "Upload for review"}
          </button>
          <p className="subtle">
            {user?.read_only_demo
              ? "This shared demo is view-only. Uploads are disabled."
              : "Next: review the extracted version before publishing."}
          </p>
        </form>
        <aside className="upload-journey">
          <h2>From file to evidence</h2>
          <ol>
            <li>
              <strong>Extract the source</strong>
              <p>The immutable text and its hash become a version record.</p>
            </li>
            <li>
              <strong>Review its context</strong>
              <p>
                Verify the exact passage, authority, scope and effective dates.
              </p>
            </li>
            <li>
              <strong>Approve with access</strong>
              <p>
                Only approved, effective evidence with a current grant can
                support an answer.
              </p>
            </li>
          </ol>
        </aside>
      </div>
    </>
  );
}
