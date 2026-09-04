import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BatchTrackMoveDialog } from '../src/client/components/BatchTrackMoveDialog.js';
import type { Track } from '../src/client/types.js';

const selectedTrack = {
  id: 'track', projectId: 'project', categoryId: 'category', subcategoryId: null, title: 'Son', originalFilename: 'son.wav', mimeType: 'audio/wav', sizeBytes: 1,
  durationMs: 1_000, startTimeMs: 0, endTimeMs: null, volume: 1, loop: false, fadeInMs: 0, fadeOutMs: 0, color: null, tags: [], description: null,
  copyrightText: null, sourceUrl: null, sourceId: null, position: 0, createdAt: '',
} satisfies Track;

describe('déplacement groupé des morceaux', () => {
  it('propose les sous-catégories de la catégorie de destination', () => {
    const markup = renderToStaticMarkup(createElement(BatchTrackMoveDialog, {
      projectId: 'project',
      tracks: [selectedTrack],
      categories: [{ id: 'category', projectId: 'project', name: 'Ambiances', color: '#22d3b6', position: 0, createdAt: '' }],
      subcategories: [
        { id: 'matching', projectId: 'project', categoryId: 'category', name: 'Nuit', color: '#22d3b6', position: 0, createdAt: '', updatedAt: '' },
        { id: 'other', projectId: 'project', categoryId: null, name: 'Hors catégorie', color: '#8b5cf6', position: 1, createdAt: '', updatedAt: '' },
      ],
      onClose: () => undefined,
      onChanged: () => undefined,
    }));

    expect(markup).toContain('Déplacer 1 morceau');
    expect(markup).toContain('value="matching">Nuit');
    expect(markup).not.toContain('Hors catégorie');
  });
});
