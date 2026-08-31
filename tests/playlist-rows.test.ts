import { describe, expect, it } from 'vitest';
import { movePlaylistItem, playlistEntries, playlistQueueItems, playlistRows, type PlaylistQueueItem } from '../src/client/lib/playlist-rows.js';

const items: PlaylistQueueItem[] = [
  { id: 'one', trackId: 'track-one', rowId: 'row-one' },
  { id: 'two', trackId: 'track-two', rowId: 'row-two' },
  { id: 'three', trackId: 'track-three', rowId: 'row-three' },
];

describe('rangées de playlist', () => {
  it('regroupe un morceau sur une rangée et normalise les positions enregistrées', () => {
    const result = movePlaylistItem(items, 'three', 'row-one', 'group', 4);

    expect(result.changed).toBe(true);
    expect(playlistRows(result.items).map((row) => row.items.map((item) => item.id))).toEqual([['one', 'three'], ['two']]);
    expect(playlistEntries(result.items)).toEqual([
      { trackId: 'track-one', rowIndex: 0 },
      { trackId: 'track-three', rowIndex: 0 },
      { trackId: 'track-two', rowIndex: 1 },
    ]);
  });

  it('refuse un regroupement lorsque la limite est atteinte', () => {
    const grouped = [items[0]!, { ...items[1]!, rowId: 'row-one' }, items[2]!];
    const result = movePlaylistItem(grouped, 'three', 'row-one', 'group', 2);

    expect(result.limitReached).toBe(true);
    expect(result.items).toBe(grouped);
  });

  it('sort un morceau de son groupe pour l’insérer entre deux rangées', () => {
    const grouped = [items[0]!, { ...items[1]!, rowId: 'row-one' }, items[2]!];
    const result = movePlaylistItem(grouped, 'two', 'row-three', 'before', 4);

    expect(playlistRows(result.items).map((row) => row.items.map((item) => item.id))).toEqual([['one'], ['two'], ['three']]);
  });

  it('reconstruit les identifiants locaux en conservant les rangées enregistrées', () => {
    let sequence = 0;
    const queue = playlistQueueItems([
      { trackId: 'track-one', rowIndex: 0 },
      { trackId: 'track-two', rowIndex: 0 },
      { trackId: 'track-three', rowIndex: 1 },
    ], () => `id-${++sequence}`);

    expect(queue[0]!.rowId).toBe(queue[1]!.rowId);
    expect(queue[2]!.rowId).not.toBe(queue[0]!.rowId);
  });
});
