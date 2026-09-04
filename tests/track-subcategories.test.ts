import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TrackSubcategoryPad } from '../src/client/components/TrackSubcategoryPad.js';
import { canDropTrackInSubcategoryDrawer, subcategoryMatchesSearch, trackDropPlacement, trackIdAfterTarget } from '../src/client/lib/track-subcategories.js';
import type { Track } from '../src/client/types.js';

function track(id: string, position: number, subcategoryId: string | null = null): Track {
  return { id, projectId: 'project', categoryId: 'category', subcategoryId, title: id, originalFilename: `${id}.wav`, mimeType: 'audio/wav', sizeBytes: 1, durationMs: 1_000, startTimeMs: 0, endTimeMs: null, volume: 1, loop: false, fadeInMs: 0, fadeOutMs: 0, color: null, tags: [], description: null, copyrightText: null, sourceUrl: null, sourceId: null, position, createdAt: '' };
}

describe('sous-catégories de morceaux', () => {
  it('accepte un morceau dans les espaces libres du tiroir en mode réorganisation', () => {
    expect(canDropTrackInSubcategoryDrawer(true, 'track', false)).toBe(true);
    expect(canDropTrackInSubcategoryDrawer(false, 'track', false)).toBe(false);
    expect(canDropTrackInSubcategoryDrawer(true, undefined, false)).toBe(false);
    expect(canDropTrackInSubcategoryDrawer(true, 'track', true)).toBe(false);
  });

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

  it('recherche une sous-catégorie par son nom sans tenir compte de la casse', () => {
    expect(subcategoryMatchesSearch('Ambiances de nuit', 'NUIT')).toBe(true);
    expect(subcategoryMatchesSearch('Ambiances de nuit', 'matin')).toBe(false);
  });

  it('conserve les morceaux lorsque leur sous-catégorie est supprimée', () => {
    const migration = readFileSync(new URL('../migrations/0027_wakeful_midnight.sql', import.meta.url), 'utf8');
    expect(migration).toContain('ON DELETE set null');
  });

  it('fait chevaucher les arrondis de jonction avec les traits verticaux', () => {
    const styles = readFileSync(new URL('../src/client/styles.css', import.meta.url), 'utf8');
    expect(styles).toContain('.subcategory-drawer-join::before { left: -16px;');
    expect(styles).toContain('.subcategory-drawer-join::after { right: -16px;');
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
      onDragLeave: () => undefined,
      onDrop: () => undefined,
      onDragStart: () => undefined,
      onDragEnd: () => undefined,
    }));

    expect(markup).toContain('subcategory-count-badge');
    expect(markup).toContain('aria-label="2 morceaux">2</span>');
    expect(markup).toContain('subcategory-titlebar');
    expect(markup).toContain('subcategory-edge-title">Ambiances');
    expect(markup).toContain('aria-label="Modifier Ambiances"');
    expect(markup).toContain('aria-expanded="false"');
  });
});
