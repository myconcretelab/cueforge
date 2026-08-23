export interface StopwatchState {
  elapsedMs: number;
  startedAt?: number;
}

export function resolveCategoryId(categoryIds: string[], storedCategoryId: string | null): string {
  if (storedCategoryId === 'all') return 'all';
  if (storedCategoryId && categoryIds.includes(storedCategoryId)) return storedCategoryId;
  return categoryIds[0] ?? 'all';
}

export function playlistIsVisible(categoryId: string | null | undefined, selectedCategoryId: string, isSearching: boolean): boolean {
  return isSearching || selectedCategoryId === 'all' || categoryId === selectedCategoryId;
}

export function parseStopwatchState(value: string | null): StopwatchState {
  if (!value) return { elapsedMs: 0 };
  try {
    const parsed = JSON.parse(value) as Partial<StopwatchState>;
    const elapsedMs = typeof parsed.elapsedMs === 'number' && Number.isFinite(parsed.elapsedMs) ? Math.max(0, parsed.elapsedMs) : 0;
    const startedAt = typeof parsed.startedAt === 'number' && Number.isFinite(parsed.startedAt) && parsed.startedAt > 0 ? parsed.startedAt : undefined;
    return { elapsedMs, startedAt };
  } catch {
    return { elapsedMs: 0 };
  }
}
