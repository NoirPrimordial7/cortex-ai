import type { TextRange } from "./sourceText";
export function MarkedText({
  text,
  offset = 0,
  evidence,
  matches = [],
}: {
  text: string;
  offset?: number;
  evidence?: TextRange;
  matches?: TextRange[];
}) {
  const chars = Array.from(text),
    end = offset + chars.length;
  const ranges = [
    ...(evidence ? [{ ...evidence, kind: "evidence" }] : []),
    ...matches.map((r) => ({ ...r, kind: "match" })),
  ].filter((r) => r.start < end && r.end > offset);
  const points = [
    ...new Set([
      offset,
      end,
      ...ranges.flatMap((r) => [
        Math.max(offset, r.start),
        Math.min(end, r.end),
      ]),
    ]),
  ].sort((a, b) => a - b);
  return (
    <>
      {points.slice(0, -1).map((start, i) => {
        const stop = points[i + 1],
          hit = ranges.find((r) => r.start <= start && r.end >= stop);
        const value = chars.slice(start - offset, stop - offset).join("");
        return hit ? (
          <mark key={start} data-highlight={hit.kind} tabIndex={-1}>
            {value}
          </mark>
        ) : (
          <span key={start}>{value}</span>
        );
      })}
    </>
  );
}
