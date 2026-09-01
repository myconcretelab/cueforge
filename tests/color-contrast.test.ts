import { describe, expect, it } from 'vitest';
import { contrastColor } from '../src/client/lib/color-contrast.js';

describe('contraste des couleurs', () => {
  it('utilise du blanc sur les fonds sombres', () => {
    expect(contrastColor('#000000')).toBe('#ffffff');
    expect(contrastColor('#6d28d9')).toBe('#ffffff');
  });

  it('utilise du noir sur les fonds clairs', () => {
    expect(contrastColor('#ffffff')).toBe('#000000');
    expect(contrastColor('#eab308')).toBe('#000000');
  });

  it('conserve un contraste lisible pour une valeur inattendue', () => {
    expect(contrastColor('transparent')).toBe('#ffffff');
  });
});
