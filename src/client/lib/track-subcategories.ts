import type { Track } from '../types';

export type TrackDropPlacement = 'before' | 'group' | 'after';

export function trackDropPlacement(clientX: number, left: number, width: number): TrackDropPlacement {
  if (width <= 0) return 'group';
  const ratio = (clientX - left) / width;
  if (ratio < .23) return 'before';
  if (ratio > .77) return 'after';
  return 'group';
}

export function trackIdAfterTarget(tracks: Track[], target: Track): string | undefined {
  const siblings = tracks.filter((track) => track.categoryId === target.categoryId && track.subcategoryId === target.subcategoryId)
    .sort((first, second) => first.position - second.position || first.id.localeCompare(second.id));
  const targetIndex = siblings.findIndex((track) => track.id === target.id);
  return targetIndex < 0 ? undefined : siblings[targetIndex + 1]?.id;
}
