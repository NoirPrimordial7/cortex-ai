/** The API counts Unicode code points, not JavaScript UTF-16 code units. */
export function sourceSlice(text: string, start: number, end?: number) {
  return Array.from(text).slice(start, end).join("");
}
export type TextRange = { start: number; end: number };
export type ReadingBlock = TextRange & {
  text: string;
  heading: boolean;
  table: boolean;
};
export function readingPages(text: string, budget = 3200) {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
  const pages: ReadingBlock[][] = [[]];
  let start = 0,
    used = 0;
  for (const line of lines) {
    // Bound very long unbroken paragraphs without altering a single character.
    const chars = Array.from(line);
    for (let i = 0; i < chars.length; i += 900) {
      const value = chars.slice(i, i + 900).join("");
      const length = Array.from(value).length;
      if (used + length > budget && pages.at(-1)!.length) {
        pages.push([]);
        used = 0;
      }
      pages.at(-1)!.push({
        start,
        end: start + length,
        text: value,
        heading:
          i === 0 &&
          /^(?:#{1,3} |\d+\. [A-Z]|[A-Z][A-Z /&–-]{5,})/.test(value.trim()),
        table: value.includes(" | "),
      });
      start += length;
      used += length;
    }
  }
  return pages;
}
export function contextRange(text: string, range: TextRange): TextRange {
  const chars = Array.from(text);
  let start = range.start,
    end = range.end;
  // Include the complete containing paragraph, then complete adjacent paragraphs.
  while (start > 0 && chars[start - 1] !== "\n") start--;
  while (end < chars.length && chars[end] !== "\n") end++;
  let left = start,
    right = end;
  for (let i = 0; i < 3 && left > 0; i++) {
    let prior = left - 1;
    while (prior > 0 && chars[prior - 1] !== "\n") prior--;
    if (start - prior > 700) break;
    left = prior;
  }
  for (let i = 0; i < 3 && right < chars.length; i++) {
    let next = right + 1;
    while (next < chars.length && chars[next] !== "\n") next++;
    if (next - end > 700) break;
    right = next;
  }
  start = left;
  end = right;
  return { start, end };
}
