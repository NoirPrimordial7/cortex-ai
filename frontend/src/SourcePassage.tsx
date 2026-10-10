import type { Source } from "./types";
import { contextRange, sourceSlice } from "./sourceText";
import { MarkedText } from "./SourceMarkup";
import { useEffect, useRef } from "react";

/** Render only the authorized source returned by the citation endpoint. */
export function HighlightedSource({ source }: { source: Source }) {
  const passage = useRef<HTMLPreElement>(null);
  useEffect(() => {
    passage.current
      ?.querySelector("mark")
      ?.scrollIntoView?.({ block: "center", behavior: "instant" });
  }, [source.query_id, source.id]);
  const range = contextRange(source.text, {
    start: source.start_char - (source.text_start_char || 0),
    end: source.end_char - (source.text_start_char || 0),
  });
  return (
    <pre className="source-text focused-passage" ref={passage}>
      <MarkedText
        text={sourceSlice(source.text, range.start, range.end)}
        offset={range.start + (source.text_start_char || 0)}
        evidence={{ start: source.start_char, end: source.end_char }}
      />
    </pre>
  );
}
