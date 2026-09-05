export type SoundboardViewMode = 'cards' | 'list' | 'auto';
export type SoundboardView = 'cards' | 'list';

export interface SoundboardViewSettings {
  mode: SoundboardViewMode;
  automaticListThreshold: number;
  desktopListColumns: number;
  mobileListColumns: number;
}

export const defaultSoundboardViewSettings: SoundboardViewSettings = {
  mode: 'cards',
  automaticListThreshold: 30,
  desktopListColumns: 2,
  mobileListColumns: 1,
};

export function resolveSoundboardView(mode: SoundboardViewMode, trackCount: number, threshold: number): SoundboardView {
  if (mode === 'auto') return trackCount >= threshold ? 'list' : 'cards';
  return mode;
}

export function readSoundboardViewSettings(serialized: string | null): SoundboardViewSettings {
  if (!serialized) return { ...defaultSoundboardViewSettings };
  try {
    const value = JSON.parse(serialized) as Partial<SoundboardViewSettings>;
    return {
      mode: value.mode === 'list' || value.mode === 'auto' || value.mode === 'cards' ? value.mode : defaultSoundboardViewSettings.mode,
      automaticListThreshold: clamp(value.automaticListThreshold, 5, 200, defaultSoundboardViewSettings.automaticListThreshold),
      desktopListColumns: clamp(value.desktopListColumns, 1, 4, defaultSoundboardViewSettings.desktopListColumns),
      mobileListColumns: clamp(value.mobileListColumns, 1, 2, defaultSoundboardViewSettings.mobileListColumns),
    };
  } catch {
    return { ...defaultSoundboardViewSettings };
  }
}

export function soundboardViewStorageKey(projectId: string): string {
  return `sonoriva-soundboard-view:${projectId}`;
}

function clamp(value: number | undefined, minimum: number, maximum: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.round(value))) : fallback;
}
