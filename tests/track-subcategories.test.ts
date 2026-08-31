import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TrackSubcategoryPad } from '../src/client/components/TrackSubcategoryPad.js';
import { trackDropPlacement, trackIdAfterTarget } from '../src/client/lib/track-subcategories.js';
import type { Track } from '../src/client/types.js';

function track(id: string, position: number, subcategoryId: string | null = null): Track {
  return { id, projectId: 'project', categoryId: 'category', subcategoryId, title: id, originalFilename: `${id}.wav`, mimeType: 'audio/wav', sizeBytes: 1, durationMs: 1_000, startTimeMs: 0, endTimeMs: null, volume: 1, loop: false, fadeInMs: 0, fadeOutMs: 0, color: null, tags: [], description: null, copyrightText: null, sourceUrl: null, sourceId: null, position, createdAt: '' };
}

describe('sous-catégories de morceaux', () => {
  it('réserve le centre au regroupement et les bords à l’insertion', () => {
    expect(trackDropPlacement(10, 0, 100)).toBe('before');
    expect(trackDropPlacement(50, 0, 100)).toBe('group');
    expect(trackDropPlacement(90, 0, 100)).toBe('after');
  });

  it('cherche la position suivante uniquement au même niveau', () => {
    const tracks = [track('one', 0), track('hidden', 1, 'group'), track('two', 2), track('three', 3, 'group')];
    expect(trackIdAfterTarget(tracks, tracks[0]!)).toBe('two');
    expect(trackIdAfterTarget(tracks, tracks[1]!)).toBe('three');
  });

  it('conserve les morceaux lorsque leur sous-catégorie est supprimée', () => {
    const migration = readFileSync(new URL('../migrations/0027_wakeful_midnight.sql', import.meta.url), 'utf8');
    expect(migration).toContain('ON DELETE set null');
  });

  it('affiche une tuile compacte avec son titre et son compteur', () => {
    const markup = renderToStaticMarkup(createElement(TrackSubcategoryPad, {
      subcategory: { id: 'group', projectId: 'project', categoryId: 'category', name: 'Ambiances', color: '#8b5cf6', position: 0, createdAt: '', updatedAt: '' },
      tracks: [track('one', 0), track('two', 1)],
      open: false,
      reorderEnabled: false,
      dropTarget: false,
      onToggle: () => undefined,
      onEdit: () => undefined,
      onDragOver: () => undefined,
      onDrop: () => undefined,
      onDragStart: () => undefined,
      onDragEnd: () => undefined,
    }));

    expect(markup).toContain('subcategory-edge-title">Ambiances');
    expect(markup).toContain('2 morceaux');
    expect(markup).toContain('aria-expanded="false"');
  });
});
