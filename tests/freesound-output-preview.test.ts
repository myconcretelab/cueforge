import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('préécoute Openverse par sortie', () => {
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

  it('place le raccourci Openverse dans la recherche sans remplacer son filtrage', () => {
    const source = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    expect(source).toContain('className="search-openverse"');
    expect(source).toContain('setOpenverseOpen(true)');
    expect(source).toContain('value={search} onChange={(event) => setSearch(event.target.value)}');
    expect(source).toContain('initialQuery={search}');
    expect(source).toContain('setOpenverseAutoSearch(true)');
    expect(source).toContain('autoSearch={openverseAutoSearch}');
  });

  it('lance la recherche transmise et propose les couleurs du spectacle à l’import', () => {
    const source = readFileSync(new URL('../src/client/components/FreesoundDialog.tsx', import.meta.url), 'utf8');
    expect(source).toContain('autoSearchStartedRef');
    expect(source).toContain('searchSounds().catch');
    expect(source).toContain('projectColors.map');
    expect(source).toContain('color: importColor');
  });

  it('propose et transmet une sous-catégorie compatible pendant l’import', () => {
    const source = readFileSync(new URL('../src/client/components/FreesoundDialog.tsx', import.meta.url), 'utf8');
    expect(source).toContain('subcategory.categoryId === (importCategoryId || null)');
    expect(source).toContain('setImportSubcategoryId');
    expect(source).toContain('subcategoryId: importSubcategoryId || undefined');
  });

  it('permet de cumuler les quatre sources et les distingue dans les résultats', () => {
    const source = readFileSync(new URL('../src/client/components/FreesoundDialog.tsx', import.meta.url), 'utf8');
    expect(source).toContain("value: 'freesound'");
    expect(source).toContain("value: 'jamendo'");
    expect(source).toContain("value: 'wikimedia_audio'");
    expect(source).toContain("value: 'ccmixter'");
    expect(source).toContain('aria-pressed={sources.has(source.value)}');
    expect(source).toContain('source-${sound.source}');
  });
});
