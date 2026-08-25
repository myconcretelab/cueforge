import { describe, expect, it } from 'vitest';
import { appNoticesEnabled } from '../src/client/lib/app-mode.js';

describe('messages applicatifs', () => {
  it('masque les messages de mise à jour dans une démonstration', () => {
    expect(appNoticesEnabled({ isDemo: true })).toBe(false);
  });

  it('conserve les messages pour les comptes personnels', () => {
    expect(appNoticesEnabled({ isDemo: false })).toBe(true);
  });
});
