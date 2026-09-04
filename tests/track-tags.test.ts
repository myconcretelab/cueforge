import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeTrackTags, toggleSearchScopeSelection, trackMatchesEnabledSearch, trackMatchesSearch } from '../src/client/lib/track-tags.js';
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

  it('réunit les correspondances quand les filtres nom et tags sont actifs', () => {
    expect(trackMatchesEnabledSearch(track, 'public', { name: true, tags: true })).toBe(true);
    expect(trackMatchesEnabledSearch(track, 'foule', { name: true, tags: true })).toBe(true);
    expect(trackMatchesEnabledSearch(track, 'foule', { name: true, tags: false })).toBe(false);
  });

  it('cumule les filtres tout en conservant au moins un choix actif', () => {
    const namesAndTags = toggleSearchScopeSelection(new Set(['name']), 'tags');
    expect([...namesAndTags]).toEqual(['name', 'tags']);
    expect([...toggleSearchScopeSelection(new Set(['tags']), 'subcategories')]).toEqual(['tags', 'subcategories']);
    expect([...toggleSearchScopeSelection(namesAndTags, 'name')]).toEqual(['tags']);
    expect([...toggleSearchScopeSelection(new Set(['tags']), 'tags')]).toEqual(['tags']);
  });

  it('affiche une commande pour effacer la recherche courante', () => {
    const source = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    expect(source).toContain('className="search-clear"');
    expect(source).toContain('aria-label="Annuler la recherche"');
    expect(source).toContain("setSearch('')");
  });
});
