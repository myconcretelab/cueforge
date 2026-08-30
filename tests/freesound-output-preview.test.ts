import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('préécoute Freesound par sortie', () => {
  it('affiche un bouton coloré pour chaque sortie secondaire', () => {
    const source = readFileSync(new URL('../src/client/components/FreesoundDialog.tsx', import.meta.url), 'utf8');
    expect(source).toContain('alternateBridgeOutputs.map');
    expect(source).toContain('className="freesound-output-play"');
    expect(source).toContain('Écouter ${sound.name} sur ${output.name}');
  });

  it('transmet les sorties actives depuis la régie', () => {
    const source = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    expect(source).toContain('bridgeOutputs={routedBridgeOutputs}');
    expect(source).toContain('mainBridgeOutputId={mainBridgeOutputId}');
  });

  it('utilise le Bridge actif pour les préécoutes distantes', () => {
    const source = readFileSync(new URL('../src/client/components/FreesoundDialog.tsx', import.meta.url), 'utf8');
    expect(source).toContain('bridgeClient.isEnabled()');
    expect(source).toContain("includes('remotePreview')");
    expect(source).toContain('bridgeClient.playRemotePreview');
  });

  it('place le raccourci Freesound dans la recherche sans remplacer son filtrage', () => {
    const source = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    expect(source).toContain('className="search-freesound"');
    expect(source).toContain('setFreesoundOpen(true)');
    expect(source).toContain('value={search} onChange={(event) => setSearch(event.target.value)}');
    expect(source).toContain('initialQuery={search}');
  });
});
