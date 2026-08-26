import { describe, expect, it } from 'vitest';
import { appNoticesEnabled, shouldApplyAppUpdate, shouldOpenReleaseNotes } from '../src/client/lib/app-mode.js';

describe('messages applicatifs', () => {
  it('masque les messages de mise à jour dans une démonstration', () => {
    expect(appNoticesEnabled({ isDemo: true })).toBe(false);
  });

  it('conserve les messages pour les comptes personnels', () => {
    expect(appNoticesEnabled({ isDemo: false })).toBe(true);
  });

  it('installe automatiquement uniquement lorsque la régie est inactive', () => {
    expect(shouldApplyAppUpdate({ automaticUpdates: true, updateAvailable: true, activePlaybackCount: 0 })).toBe(true);
    expect(shouldApplyAppUpdate({ automaticUpdates: true, updateAvailable: true, activePlaybackCount: 1 })).toBe(false);
    expect(shouldApplyAppUpdate({ automaticUpdates: false, updateAvailable: true, activePlaybackCount: 0 })).toBe(false);
    expect(shouldApplyAppUpdate({ automaticUpdates: true, updateAvailable: false, activePlaybackCount: 0 })).toBe(false);
  });

  it('n’ouvre pas automatiquement les notes en mode silencieux', () => {
    const base = { noticesEnabled: true, unseenReleaseCount: 1, activePlaybackCount: 0, alreadyOpened: false };
    expect(shouldOpenReleaseNotes({ ...base, automaticUpdates: false })).toBe(true);
    expect(shouldOpenReleaseNotes({ ...base, automaticUpdates: true })).toBe(false);
    expect(shouldOpenReleaseNotes({ ...base, automaticUpdates: false, activePlaybackCount: 1 })).toBe(false);
  });
});
