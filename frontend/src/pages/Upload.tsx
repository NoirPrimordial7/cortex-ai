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
      <form className="upload-form" onSubmit={(e) => void submit(e)}>
        <fieldset
          disabled={busy || user?.read_only_demo}
          className="upload-fields"
        >
          <div className="upload-intro">
            <UploadSimpleIcon size={24} />
            <h2>Start with the source</h2>
            <p>
              UTF-8 TXT, text-bearing PDF or DOCX · up to 10 MiB.
              <br />
              Scanned and encrypted PDFs are unsupported.
            </p>
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
            : "After extraction, review effective dates, the exact passage, source authority and access before publishing. Uploading alone does not make a policy eligible for answers."}
        </p>
      </form>
    </>
  );
}
