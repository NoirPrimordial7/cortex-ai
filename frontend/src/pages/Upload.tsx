import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UploadSimpleIcon, FileTextIcon } from "@phosphor-icons/react";
import { api } from "../api";
import { PageHeading } from "../components";
export default function Upload() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        <div className="upload-intro">
          <UploadSimpleIcon size={36} weight="light" />
          <h2>Bring the source. Review the context.</h2>
          <p>
            UTF-8 TXT, text-bearing PDF or DOCX · up to 10 MiB.
            <br />
            Scanned and encrypted PDFs are unsupported.
          </p>
        </div>
        <label>
          Document title
          <input
            name="title"
            maxLength={200}
            placeholder="A clear policy title"
            required
          />
        </label>
        <label>
          Category
          <select name="category">
            <option value="policy">Policy</option>
            <option value="SOP">SOP</option>
            <option value="project">Project</option>
          </select>
        </label>
        <label className="file-input">
          <FileTextIcon size={24} />
          <span>Choose a source file</span>
          <input name="file" type="file" accept=".txt,.pdf,.docx" required />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Extracting document…" : "Upload for review"}
        </button>
        <p className="subtle">
          Review effective dates, source authority and access before
          publication.
        </p>
      </form>
    </>
  );
}
