import { ArrowLeftIcon } from "@phosphor-icons/react";
import { SourceDialog } from "./components";
import { SourceInspector } from "./SourceInspector";
import { useCitationAccess } from "./useCitationAccess";
export function CitationDialog({
  access,
}: {
  access: ReturnType<typeof useCitationAccess>;
}) {
  return access.citation ? (
    <SourceDialog
      label="Source evidence"
      onClose={access.close}
      className="citation-dialog"
    >
      <button className="back-link" onClick={access.close}>
        <ArrowLeftIcon size={18} />
        Back to activity
      </button>
      <SourceInspector
        citation={access.citation}
        source={access.source}
        busy={access.busy}
        conflict={access.conflict}
        context={access.context}
      />
    </SourceDialog>
  ) : null;
}
