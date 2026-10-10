import type { Source } from "./types";

/** Render only the authorized source returned by the citation endpoint. */
export function HighlightedSource({ source }: { source: Source }) {
  return (
    <pre className="source-text">
      {source.text.slice(0, source.start_char)}
      <mark>{source.text.slice(source.start_char, source.end_char)}</mark>
      {source.text.slice(source.end_char)}
    </pre>
  );
}
