export interface WaveformWindow { startMs: number; endMs: number; durationMs: number }

export function waveformWindow(totalMs: number, zoom: number, pan: number): WaveformWindow {
  const safeTotal = Math.max(1, totalMs);
  const safeZoom = clamp(zoom, 1, 64);
  const durationMs = safeTotal / safeZoom;
  const startMs = (safeTotal - durationMs) * clamp(pan, 0, 1);
  return { startMs, endMs: startMs + durationMs, durationMs };
}

export function waveformPosition(timeMs: number, window: WaveformWindow): number {
  return (timeMs - window.startMs) / window.durationMs;
}

export function waveformTime(position: number, window: WaveformWindow): number {
  return Math.round(window.startMs + clamp(position, 0, 1) * window.durationMs);
}

export function clampStartMs(value: number, endMs: number, totalMs: number): number {
  return Math.round(clamp(value, 0, Math.max(0, Math.min(endMs - 1, totalMs - 1))));
}

export function clampEndMs(value: number, startMs: number, totalMs: number): number {
  return Math.round(clamp(value, Math.min(totalMs, startMs + 1), totalMs));
}

export function selectionViewport(totalMs: number, startMs: number, endMs: number): { zoom: number; pan: number } {
  const selectionMs = Math.max(1, endMs - startMs);
  const zoom = clamp(totalMs / (selectionMs * 1.3), 1, 64);
  const visibleMs = totalMs / zoom;
  const centeredStart = (startMs + endMs - visibleMs) / 2;
  const pan = totalMs === visibleMs ? 0 : clamp(centeredStart / (totalMs - visibleMs), 0, 1);
  return { zoom, pan };
}

export function formatWaveformTime(ms: number): string {
  const safeMs = Math.max(0, Math.round(ms));
  const minutes = Math.floor(safeMs / 60_000);
  const seconds = Math.floor(safeMs % 60_000 / 1_000);
  const milliseconds = safeMs % 1_000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}
