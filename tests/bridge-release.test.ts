import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const bridgePackage = JSON.parse(readFileSync(new URL('../bridge/package.json', import.meta.url), 'utf8')) as { version: string };
const tauriConfig = JSON.parse(readFileSync(new URL('../bridge/src-tauri/tauri.conf.json', import.meta.url), 'utf8')) as {
  version: string;
  bundle: { macOS: { minimumSystemVersion: string } };
};
const cargoManifest = readFileSync(new URL('../bridge/src-tauri/Cargo.toml', import.meta.url), 'utf8');
const bridgeUi = readFileSync(new URL('../bridge/ui/index.html', import.meta.url), 'utf8');

describe('distribution du Bridge', () => {
  it('garde la même version dans tous les manifestes et dans l’interface', () => {
    expect(tauriConfig.version).toBe(bridgePackage.version);
    expect(cargoManifest).toContain(`version = "${bridgePackage.version}"`);
    expect(bridgeUi).toContain(`id="bridge-version">${bridgePackage.version}<`);
  });

  it('produit les paquets macOS pour Big Sur et les versions ultérieures', () => {
    expect(tauriConfig.bundle.macOS.minimumSystemVersion).toBe('11.0');
  });
});
