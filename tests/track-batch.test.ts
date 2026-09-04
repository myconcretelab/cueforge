import { describe, expect, it } from 'vitest';
import { applyTrackTagChange, batchTrackLocationUpdate } from '../src/server/services/track-batch.js';

describe('édition groupée des tags', () => {
  it('ajoute uniquement les nouveaux tags sans tenir compte de la casse', () => {
    expect(applyTrackTagChange(['Ambiance', 'Nuit'], { mode: 'add', tags: ['ambiance', 'Extérieur'] }))
      .toEqual(['Ambiance', 'Nuit', 'Extérieur']);
  });

  it('retire les tags demandés sans tenir compte de la casse', () => {
    expect(applyTrackTagChange(['Ambiance', 'Nuit', 'Extérieur'], { mode: 'remove', tags: ['NUIT', 'absent'] }))
      .toEqual(['Ambiance', 'Extérieur']);
  });

  it('remplace toute la liste', () => {
    expect(applyTrackTagChange(['Ancien'], { mode: 'replace', tags: ['Nouveau'] })).toEqual(['Nouveau']);
  });
});

describe('déplacement groupé', () => {
  it('aligne la catégorie sur la sous-catégorie choisie', () => {
    expect(batchTrackLocationUpdate(
      { categoryId: 'ancienne', subcategoryId: 'groupe' },
      { id: 'groupe', categoryId: 'nouvelle' },
    )).toEqual({ categoryId: 'nouvelle', subcategoryId: 'groupe' });
  });

  it('sort les morceaux de leur sous-catégorie lors d’un déplacement à la racine', () => {
    expect(batchTrackLocationUpdate({ categoryId: 'destination' })).toEqual({ subcategoryId: null });
    expect(batchTrackLocationUpdate({ subcategoryId: null })).toEqual({ subcategoryId: null });
  });
});
