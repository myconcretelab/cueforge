import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/server/services/auth.js';
import { parseByteRange } from '../src/server/services/range.js';

describe('password hashing', () => {
  it('accepte le bon mot de passe et refuse les autres', async () => {
    const stored = await hashPassword('un-mot-de-passe-solide');
    expect(stored).not.toContain('un-mot-de-passe-solide');
    await expect(verifyPassword('un-mot-de-passe-solide', stored)).resolves.toBe(true);
    await expect(verifyPassword('mauvais-mot-de-passe', stored)).resolves.toBe(false);
  });

  it('produit des empreintes différentes grâce au sel', async () => {
    const first = await hashPassword('mot-de-passe-identique');
    const second = await hashPassword('mot-de-passe-identique');
    expect(first).not.toBe(second);
  });
});

describe('HTTP byte ranges', () => {
  it('analyse une plage explicite', () => {
    expect(parseByteRange('bytes=100-199', 1000)).toEqual({ start: 100, end: 199 });
  });

  it('limite la fin à la taille du fichier', () => {
    expect(parseByteRange('bytes=900-1200', 1000)).toEqual({ start: 900, end: 999 });
  });

  it('prend en charge une plage suffixe', () => {
    expect(parseByteRange('bytes=-250', 1000)).toEqual({ start: 750, end: 999 });
  });

  it('refuse les plages impossibles', () => {
    expect(parseByteRange('bytes=1000-', 1000)).toBeNull();
    expect(parseByteRange('bytes=-', 1000)).toBeNull();
  });
});
