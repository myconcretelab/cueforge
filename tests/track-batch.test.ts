import { describe, expect, it } from 'vitest';
import { applyTrackTagChange } from '../src/server/services/track-batch.js';

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
