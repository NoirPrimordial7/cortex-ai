export function readableName(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}
export function populationName(value: string) {
  return value === "india_full_time"
    ? "India · full-time"
    : value === "india_contractor"
      ? "India · contractor"
      : readableName(value);
}
