import { describe, expect, it } from 'vitest';
import { reorderTracks } from '../src/server/services/reorder.js';

const tracks = [
  { id: 'a', categoryId: 'one', position: 0 },
  { id: 'b', categoryId: 'one', position: 1 },
  { id: 'c', categoryId: 'two', position: 2 },
  { id: 'd', categoryId: 'two', position: 3 },
];

describe('track reordering', () => {
  it('insère un morceau avant un autre et change sa catégorie', () => {
    const result = reorderTracks(tracks, 'a', 'two', 'd');
    expect(result.map((track) => track.id)).toEqual(['b', 'c', 'a', 'd']);
    expect(result.find((track) => track.id === 'a')?.categoryId).toBe('two');
    expect(result.map((track) => track.position)).toEqual([0, 1, 2, 3]);
  });

  it('déplace un morceau à la fin de la catégorie visée', () => {
    const result = reorderTracks(tracks, 'b', 'two');
    expect(result.map((track) => track.id)).toEqual(['a', 'c', 'd', 'b']);
    expect(result.at(-1)?.categoryId).toBe('two');
  });
});
