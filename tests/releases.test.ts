import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_RELEASES, compareVersions, CURRENT_VERSION, releasesAfter } from '../src/server/releases.js';

describe('app releases', () => {
  it('conserve la version applicative alignée avec package.json', () => {
    const packageMetadata = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(CURRENT_VERSION).toBe(packageMetadata.version);
    expect(APP_RELEASES[0]?.version).toBe(CURRENT_VERSION);
  });

  it('retourne uniquement les versions encore non consultées', () => {
    expect(releasesAfter(null).map((release) => release.version)).toEqual(['0.2.0']);
    expect(releasesAfter('0.1.0').map((release) => release.version)).toEqual(['0.2.0']);
    expect(releasesAfter('0.2.0')).toEqual([]);
  });

  it('compare les versions sémantiques numériquement', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });
});
