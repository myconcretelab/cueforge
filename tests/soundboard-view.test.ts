import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaultSoundboardViewSettings, readSoundboardViewSettings, resolveSoundboardView, soundboardViewStorageKey } from '../src/client/lib/soundboard-view';

describe('soundboard view', () => {
  it('resolves the automatic list view from the configured track threshold', () => {
    expect(resolveSoundboardView('auto', 29, 30)).toBe('cards');
    expect(resolveSoundboardView('auto', 30, 30)).toBe('list');
    expect(resolveSoundboardView('cards', 100, 30)).toBe('cards');
    expect(resolveSoundboardView('list', 1, 30)).toBe('list');
  });

  it('restores and clamps persisted display settings', () => {
    expect(readSoundboardViewSettings(JSON.stringify({ mode: 'auto', automaticListThreshold: 500, desktopListColumns: 3, mobileListColumns: 8 }))).toEqual({
      mode: 'auto', automaticListThreshold: 200, desktopListColumns: 3, mobileListColumns: 2,
    });
    expect(readSoundboardViewSettings('{')).toEqual(defaultSoundboardViewSettings);
  });

  it('uses a distinct persistence key for each project', () => {
    expect(soundboardViewStorageKey('project-a')).not.toBe(soundboardViewStorageKey('project-b'));
  });

  it('renders configurable multi-column list items with their track metadata', () => {
    const app = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    const trackPad = readFileSync(new URL('../src/client/components/TrackPad.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('../src/client/styles.css', import.meta.url), 'utf8');

    expect(app).toContain("resolveSoundboardView(soundboardViewSettings.mode, categoryTracks.length");
    expect(app).toContain("soundboardView === 'list' ? 'is-list' : ''");
    expect(app).toContain('Colonnes de liste');
    expect(trackPad).toContain('track-list-shortcut');
    expect(styles).toContain('.track-grid.is-list');
    expect(styles).toContain('grid-template-columns: minmax(0, 1fr) auto 110px;');
  });
});
