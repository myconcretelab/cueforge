import { describe, expect, it } from 'vitest';
import { sameIds } from '../src/server/services/order.js';

describe('ordered collection validation', () => {
  it('accepte chaque identifiant exactement une fois, quel que soit l’ordre', () => {
    expect(sameIds(['b', 'c', 'a'], ['a', 'b', 'c'])).toBe(true);
  });

  it('refuse les identifiants manquants, étrangers ou dupliqués', () => {
    expect(sameIds(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
    expect(sameIds(['a', 'b', 'x'], ['a', 'b', 'c'])).toBe(false);
    expect(sameIds(['a', 'a', 'c'], ['a', 'b', 'c'])).toBe(false);
  });
});
