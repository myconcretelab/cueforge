export type TrackTagChange = {
  mode: 'add' | 'remove' | 'replace';
  tags: string[];
};

export function applyTrackTagChange(existingTags: string[], change: TrackTagChange): string[] {
  if (change.mode === 'replace') return [...change.tags];
  const changedKeys = new Set(change.tags.map((tag) => tag.toLocaleLowerCase('fr')));
  if (change.mode === 'remove') {
    return existingTags.filter((tag) => !changedKeys.has(tag.toLocaleLowerCase('fr')));
  }
  const result = [...existingTags];
  const existingKeys = new Set(existingTags.map((tag) => tag.toLocaleLowerCase('fr')));
  for (const tag of change.tags) {
    const key = tag.toLocaleLowerCase('fr');
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    result.push(tag);
  }
  return result;
}
