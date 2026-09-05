import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('mise à jour du service worker', () => {
  it('versionne le cache applicatif avec chaque commit construit', () => {
    const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
    const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

    expect(worker).toContain("const BUILD_REVISION = '__SONORIVA_BUILD_REVISION__'");
    expect(worker).toContain('`sonoriva-shell-${BUILD_REVISION}`');
    expect(viteConfig).toContain("execFileSync('git', ['rev-parse', '--short=12', 'HEAD']");
    expect(viteConfig).toContain('source.replaceAll(serviceWorkerRevisionToken, revision)');
  });
});
