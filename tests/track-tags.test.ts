import { describe, expect, it } from 'vitest';
import { normalizeTrackTags, trackMatchesSearch } from '../src/client/lib/track-tags.js';
import type { Track } from '../src/client/types.js';

const track = {
  title: 'Entrée du public',
  originalFilename: 'ambiance-salle.wav',
  tags: ['Accueil', 'Avant spectacle', 'Foule'],
} as Track;

describe('tags des morceaux', () => {
  it('nettoie les tags et retire les doublons sans tenir compte de la casse', () => {
    expect(normalizeTrackTags(['  #Ambiance  ', 'ambiance', 'Effet   long', '', ' #Nuit'])).toEqual([
      'Ambiance',
      'Effet long',
      'Nuit',
    ]);
  });

  it('recherche les noms par défaut dans le titre et le fichier', () => {
    expect(trackMatchesSearch(track, 'public', 'name')).toBe(true);
    expect(trackMatchesSearch(track, 'salle', 'name')).toBe(true);
    expect(trackMatchesSearch(track, 'foule', 'name')).toBe(false);
  });

  it('recherche chaque terme dans les tags lorsque ce mode est choisi', () => {
    expect(trackMatchesSearch(track, '#acc', 'tags')).toBe(true);
    expect(trackMatchesSearch(track, 'avant foule', 'tags')).toBe(true);
    expect(trackMatchesSearch(track, 'avant nuit', 'tags')).toBe(false);
  });
});
