import { describe, expect, it } from 'vitest';
import { parseStopwatchState, playlistIsVisible, resolveCategoryId } from '../src/client/lib/session-state.js';

describe('restauration de session', () => {
  it('ouvre la première catégorie sans préférence, puis restaure la sélection enregistrée', () => {
    expect(resolveCategoryId(['category-1', 'category-2'], null)).toBe('category-1');
    expect(resolveCategoryId(['category-1', 'category-2'], 'category-2')).toBe('category-2');
    expect(resolveCategoryId(['category-1', 'category-2'], 'all')).toBe('all');
    expect(resolveCategoryId(['category-1'], 'deleted-category')).toBe('category-1');
  });

  it('valide les valeurs restaurées du chronomètre', () => {
    expect(parseStopwatchState('{"elapsedMs":1250,"startedAt":10000}')).toEqual({ elapsedMs: 1250, startedAt: 10000 });
    expect(parseStopwatchState('{"elapsedMs":-10,"startedAt":"invalid"}')).toEqual({ elapsedMs: 0, startedAt: undefined });
    expect(parseStopwatchState('invalid')).toEqual({ elapsedMs: 0 });
  });

  it('limite une playlist à sa catégorie hors recherche', () => {
    expect(playlistIsVisible('category-1', 'category-1', false)).toBe(true);
    expect(playlistIsVisible('category-1', 'category-2', false)).toBe(false);
    expect(playlistIsVisible('category-1', 'all', false)).toBe(true);
    expect(playlistIsVisible('category-1', 'category-2', true)).toBe(true);
  });
});
