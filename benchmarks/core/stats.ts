/**
 * Deterministic timing statistics for Core benchmark reports.
 * Pure helpers — no solver coupling.
 */
export function percentile(sortedAscending: readonly number[], p: number): number {
  if (sortedAscending.length === 0) {
    return Number.NaN;
  }
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    return Number.NaN;
  }
  const idx = Math.min(
    sortedAscending.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAscending.length) - 1),
  );
  return sortedAscending[idx]!;
}

export function median(sortedAscending: readonly number[]): number {
  if (sortedAscending.length === 0) {
    return Number.NaN;
  }
  const mid = Math.floor(sortedAscending.length / 2);
  if (sortedAscending.length % 2 === 0) {
    return (sortedAscending[mid - 1]! + sortedAscending[mid]!) / 2;
  }
  return sortedAscending[mid]!;
}
