import { useState } from "react";
import { FileTextIcon } from "@phosphor-icons/react";
export function FilePicker({ disabled = false }: { disabled?: boolean }) {
  const [file, setFile] = useState<File | null>(null),
    [error, setError] = useState("");
  return (
    <label className="file-input">
      <FileTextIcon size={24} />
      <span>{file ? file.name : "Choose a source file"}</span>
      <small>
        {file
          ? `${(file.size / 1024).toFixed(1)} KiB`
          : "TXT, text-bearing PDF or DOCX · up to 10 MiB"}
      </small>
      <input
        name="file"
        aria-label="Source file"
        type="file"
        accept=".txt,.pdf,.docx"
        required
        disabled={disabled}
        aria-describedby="file-validation"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          const problem =
            f && !/\.(txt|pdf|docx)$/i.test(f.name)
              ? "Choose a TXT, PDF or DOCX file."
              : f && f.size > 10 * 1024 * 1024
                ? "The file exceeds the 10 MiB limit."
                : "";
          e.target.setCustomValidity(problem);
          setError(problem);
          setFile(f);
        }}
      />
      <span id="file-validation" className={error ? "form-error" : "subtle"}>
        {error || "Scanned and encrypted PDFs are unsupported."}
      </span>
    </label>
  );
}
