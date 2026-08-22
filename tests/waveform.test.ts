import { describe, expect, it } from 'vitest';
import {
  clampEndMs,
  clampStartMs,
  formatWaveformTime,
  selectionViewport,
  waveformTime,
  waveformWindow,
} from '../src/client/lib/waveform.js';

describe('waveform editor calculations', () => {
  it('calcule une fenêtre zoomée et convertit sa position en temps', () => {
    const view = waveformWindow(120_000, 4, .5);
    expect(view).toEqual({ startMs: 45_000, endMs: 75_000, durationMs: 30_000 });
    expect(waveformTime(.25, view)).toBe(52_500);
  });

  it('empêche les poignées de se croiser', () => {
    expect(clampStartMs(8_000, 5_000, 10_000)).toBe(4_999);
    expect(clampEndMs(2_000, 5_000, 10_000)).toBe(5_001);
  });

  it('cadre et formate une sélection précise', () => {
    const viewport = selectionViewport(180_000, 95_783, 122_534);
    expect(viewport.zoom).toBeGreaterThan(5);
    expect(viewport.pan).toBeGreaterThan(0);
    expect(formatWaveformTime(95_783)).toBe('1:35.783');
  });
});
