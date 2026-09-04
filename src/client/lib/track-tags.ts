import type { Track } from '../types';

export const maxTrackTags = 30;
export const maxTrackTagLength = 40;

export function normalizeTrackTags(values: string[]): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const tag = value.trim().replace(/^#+/, '').replace(/\s+/g, ' ').slice(0, maxTrackTagLength);
    const key = tag.toLocaleLowerCase('fr');
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === maxTrackTags) break;
  }
  return tags;
}

export type TrackSearchScope = 'name' | 'tags';

export function trackMatchesSearch(track: Track, query: string, scope: TrackSearchScope): boolean {
  const normalizedQuery = query.trim().replace(/^#+/, '').toLocaleLowerCase('fr');
  if (!normalizedQuery) return true;
  if (scope === 'name') {
    return track.title.toLocaleLowerCase('fr').includes(normalizedQuery)
      || track.originalFilename.toLocaleLowerCase('fr').includes(normalizedQuery);
  }
  const tags = (track.tags ?? []).map((tag) => tag.toLocaleLowerCase('fr'));
  return normalizedQuery.split(/\s+/).every((term) => tags.some((tag) => tag.includes(term)));
}

export function trackMatchesEnabledSearch(track: Track, query: string, enabled: Record<TrackSearchScope, boolean>): boolean {
  return (enabled.name && trackMatchesSearch(track, query, 'name'))
    || (enabled.tags && trackMatchesSearch(track, query, 'tags'));
}

export function toggleSearchScopeSelection<T extends string>(current: ReadonlySet<T>, scope: T): Set<T> {
  if (current.has(scope) && current.size === 1) return new Set(current);
  const next = new Set(current);
  if (next.has(scope)) next.delete(scope); else next.add(scope);
  return next;
}
