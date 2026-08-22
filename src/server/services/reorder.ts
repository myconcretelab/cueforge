interface OrderedTrack {
  id: string;
  categoryId: string | null;
  position: number;
}

export function reorderTracks<T extends OrderedTrack>(orderedTracks: T[], movingId: string, categoryId: string | null, beforeTrackId?: string | null): T[] {
  if (beforeTrackId === movingId) return orderedTracks;
  const moving = orderedTracks.find((track) => track.id === movingId);
  if (!moving) throw new Error('Son à déplacer introuvable.');
  const reordered = orderedTracks.filter((track) => track.id !== movingId);
  let destinationIndex = beforeTrackId ? reordered.findIndex((track) => track.id === beforeTrackId) : -1;
  if (destinationIndex < 0) {
    destinationIndex = reordered.reduce((lastIndex, track, index) => track.categoryId === categoryId ? index + 1 : lastIndex, reordered.length);
  }
  reordered.splice(destinationIndex, 0, { ...moving, categoryId });
  return reordered.map((track, position) => ({ ...track, position }));
}
