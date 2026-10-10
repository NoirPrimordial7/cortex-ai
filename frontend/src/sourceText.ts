/** API source offsets count Unicode code points, not UTF-16 code units. */
export function sourceSlice(text: string, start: number, end?: number) {
  return Array.from(text).slice(start, end).join("");
}
