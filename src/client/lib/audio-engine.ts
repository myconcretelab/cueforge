import type { MouseAction, Track } from '../types';
import { fetchTrackAudio } from './offline-audio';

export interface ActivePlayback {
  id: string;
  trackId: string;
  sequence: number;
  startedAtMs: number;
  resumedAtMs: number;
  elapsedMs: number;
  durationMs: number;
  loop: boolean;
  paused: boolean;
  volume: number;
  volumeFrom: number;
  volumeTransitionStartedAtMs: number;
  volumeTransitionDurationMs: number;
  fadingOut: boolean;
}

interface Playback extends ActivePlayback {
  source?: AudioBufferSourceNode;
  gain: GainNode;
  buffer: AudioBuffer;
  startAtSeconds: number;
  endAtSeconds: number;
  positionSeconds: number;
  stopping: boolean;
}

type Listener = (playbacks: ActivePlayback[]) => void;
type CacheListener = (loadedTrackIds: Set<string>) => void;
type HistoryListener = (progressByTrack: Map<string, number>) => void;

const historyStorageKey = 'soundflow-playback-history-v1';

class AudioEngine {
  private context?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<AudioBuffer>>();
  private active = new Map<string, Set<Playback>>();
  private listeners = new Set<Listener>();
  private cacheListeners = new Set<CacheListener>();
  private historyListeners = new Set<HistoryListener>();
  private history = readHistory();
  private playbackSequence = 0;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getActivePlaybacks());
    return () => this.listeners.delete(listener);
  }

  subscribeCache(listener: CacheListener): () => void {
    this.cacheListeners.add(listener);
    listener(new Set(this.buffers.keys()));
    return () => this.cacheListeners.delete(listener);
  }

  subscribeHistory(listener: HistoryListener): () => void {
    this.historyListeners.add(listener);
    listener(new Map(this.history));
    return () => this.historyListeners.delete(listener);
  }

  resetHistory(trackIds?: string[]): void {
    if (trackIds) for (const trackId of trackIds) this.history.delete(trackId);
    else this.history.clear();
    this.persistHistory();
    this.notifyHistory();
  }

  persistActiveProgress(): void {
    for (const instances of this.active.values()) {
      for (const playback of instances) this.recordProgress(playback, this.currentElapsedMs(playback) / playback.durationMs);
    }
  }

  private getActivePlaybacks(): ActivePlayback[] {
    return [...this.active.values()]
      .flatMap((instances) => [...instances])
      .map(({ id, trackId, sequence, startedAtMs, resumedAtMs, elapsedMs, durationMs, loop, paused, volume, volumeFrom, volumeTransitionStartedAtMs, volumeTransitionDurationMs, fadingOut }) => ({
        id, trackId, sequence, startedAtMs, resumedAtMs, elapsedMs, durationMs, loop, paused, volume,
        volumeFrom, volumeTransitionStartedAtMs, volumeTransitionDurationMs, fadingOut,
      }))
      .sort((a, b) => a.sequence - b.sequence);
  }

  private notify(): void {
    const playbacks = this.getActivePlaybacks();
    this.listeners.forEach((listener) => listener(playbacks));
  }

  private notifyCache(): void {
    const ids = new Set(this.buffers.keys());
    this.cacheListeners.forEach((listener) => listener(ids));
  }

  private notifyHistory(): void {
    const history = new Map(this.history);
    this.historyListeners.forEach((listener) => listener(history));
  }

  private recordProgress(playback: Playback, progress: number): void {
    const bounded = Math.min(1, Math.max(0, progress));
    if (bounded <= (this.history.get(playback.trackId) ?? 0)) return;
    this.history.set(playback.trackId, bounded);
    this.persistHistory();
    this.notifyHistory();
  }

  private persistHistory(): void {
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(Object.fromEntries(this.history)));
    } catch {
      // L'historique reste disponible pour la session si le stockage est indisponible.
    }
  }

  private async getContext(): Promise<AudioContext> {
    this.context ??= new AudioContext({ latencyHint: 'interactive' });
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }

  private async load(track: Track): Promise<AudioBuffer> {
    const cached = this.buffers.get(track.id);
    if (cached) return cached;
    const existing = this.pending.get(track.id);
    if (existing) return existing;
    const loading = (async () => {
      try {
        const context = await this.getContext();
        const response = await fetchTrackAudio(track.id);
        if (!response.ok) throw new Error(`Impossible de charger « ${track.title} »`);
        const decoded = await context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(track.id, decoded);
        this.notifyCache();
        return decoded;
      } finally {
        this.pending.delete(track.id);
      }
    })();
    this.pending.set(track.id, loading);
    return loading;
  }

  async preload(track: Track): Promise<void> {
    await this.load(track);
  }

  async play(track: Track, fadeInMs = track.fadeInMs, volumeMultiplier = 1): Promise<void> {
    const [context, buffer] = await Promise.all([this.getContext(), this.load(track)]);
    const gain = context.createGain();
    const startAt = Math.min(track.startTimeMs / 1000, Math.max(0, buffer.duration - 0.01));
    const endAt = track.endTimeMs ? Math.min(track.endTimeMs / 1000, buffer.duration) : buffer.duration;
    const volume = Math.min(1, Math.max(0, track.volume * volumeMultiplier));
    gain.connect(context.destination);
    const now = context.currentTime;
    if (fadeInMs > 0) {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + fadeInMs / 1000);
    } else {
      gain.gain.setValueAtTime(volume, now);
    }
    const sequence = ++this.playbackSequence;
    const startedAtMs = performance.now();
    const playback: Playback = {
      id: `${track.id}:${sequence}`,
      trackId: track.id,
      sequence,
      startedAtMs,
      resumedAtMs: startedAtMs,
      elapsedMs: 0,
      durationMs: Math.max(10, (endAt - startAt) * 1_000),
      loop: track.loop,
      paused: false,
      volume,
      volumeFrom: fadeInMs > 0 ? 0 : volume,
      volumeTransitionStartedAtMs: startedAtMs,
      volumeTransitionDurationMs: Math.max(0, fadeInMs),
      fadingOut: false,
      gain,
      buffer,
      startAtSeconds: startAt,
      endAtSeconds: endAt,
      positionSeconds: startAt,
      stopping: false,
    };
    const instances = this.active.get(track.id) ?? new Set<Playback>();
    instances.add(playback);
    this.active.set(track.id, instances);
    this.startPlaybackSource(playback);
    this.notify();
  }

  togglePauseInstance(playbackId: string): void {
    const playback = this.findPlayback(playbackId);
    if (!playback || playback.stopping) return;
    if (playback.paused) {
      playback.paused = false;
      if (!playback.loop && playback.positionSeconds >= playback.endAtSeconds - 0.005) {
        this.finishPlayback(playback, true);
        return;
      }
      this.startPlaybackSource(playback);
    } else {
      this.capturePosition(playback);
      playback.paused = true;
    }
    this.notify();
  }

  setInstanceVolume(playbackId: string, volume: number): void {
    const playback = this.findPlayback(playbackId);
    const context = this.context;
    if (!playback || !context || playback.stopping) return;
    const nextVolume = Math.min(1, Math.max(0, volume));
    const now = context.currentTime;
    const nowMs = performance.now();
    const currentVolume = playbackVolumeAt(playback, nowMs);
    playback.gain.gain.cancelScheduledValues(now);
    playback.gain.gain.setValueAtTime(currentVolume, now);
    playback.gain.gain.linearRampToValueAtTime(nextVolume, now + .03);
    playback.volume = nextVolume;
    playback.volumeFrom = currentVolume;
    playback.volumeTransitionStartedAtMs = nowMs;
    playback.volumeTransitionDurationMs = 30;
    this.notify();
  }

  setInstanceLoop(playbackId: string, loop: boolean): void {
    const playback = this.findPlayback(playbackId);
    if (!playback || playback.stopping || playback.loop === loop) return;
    if (!playback.paused) this.capturePosition(playback, true);
    if (playback.loop && !loop) {
      playback.elapsedMs = Math.max(0, playback.positionSeconds - playback.startAtSeconds) * 1_000;
    }
    playback.loop = loop;
    if (!playback.paused) this.startPlaybackSource(playback);
    this.notify();
  }

  seekInstance(playbackId: string, progress: number): void {
    const playback = this.findPlayback(playbackId);
    if (!playback || playback.stopping) return;
    const boundedProgress = Math.min(1, Math.max(0, progress));
    const wasPaused = playback.paused;
    if (!wasPaused) this.capturePosition(playback, true);
    const playableSeconds = Math.max(.01, playback.endAtSeconds - playback.startAtSeconds);
    const sourceProgress = playback.loop ? Math.min(.999_999, boundedProgress) : boundedProgress;
    playback.positionSeconds = playback.startAtSeconds + playableSeconds * sourceProgress;
    playback.elapsedMs = playback.durationMs * sourceProgress;
    playback.resumedAtMs = performance.now();
    if (!wasPaused) {
      if (!playback.loop && boundedProgress >= 1) {
        this.finishPlayback(playback, true);
        return;
      }
      this.startPlaybackSource(playback);
    }
    this.notify();
  }

  stop(trackId: string, fadeOutMs = 250): void {
    const context = this.context;
    const instances = this.active.get(trackId);
    if (!context || !instances) return;
    for (const playback of instances) this.stopPlayback(playback, fadeOutMs);
  }

  stopInstance(playbackId: string, fadeOutMs = 250): void {
    const playback = this.findPlayback(playbackId);
    if (playback) this.stopPlayback(playback, fadeOutMs);
  }

  private stopPlayback(playback: Playback, fadeOutMs: number): void {
    const context = this.context;
    if (!context) return;
    if (playback.stopping) {
      if (fadeOutMs <= 0) {
        const now = context.currentTime;
        playback.gain.gain.cancelScheduledValues(now);
        playback.gain.gain.setValueAtTime(0, now);
        if (playback.source) playback.source.stop(now);
        else this.finishPlayback(playback, false);
      }
      return;
    }
    const elapsedMs = this.currentElapsedMs(playback);
    const nowMs = performance.now();
    const currentVolume = playbackVolumeAt(playback, nowMs);
    playback.elapsedMs = elapsedMs;
    playback.resumedAtMs = nowMs;
    this.recordProgress(playback, elapsedMs / playback.durationMs);
    playback.stopping = true;
    const { source, gain } = playback;
    if (!source || playback.paused) {
      this.finishPlayback(playback, false);
      return;
    }
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    if (fadeOutMs <= 0) {
      playback.volume = 0;
      playback.volumeFrom = 0;
      playback.volumeTransitionStartedAtMs = nowMs;
      playback.volumeTransitionDurationMs = 0;
      gain.gain.setValueAtTime(0, now);
      source.stop(now);
      return;
    }
    playback.volume = 0;
    playback.volumeFrom = currentVolume;
    playback.volumeTransitionStartedAtMs = nowMs;
    playback.volumeTransitionDurationMs = fadeOutMs;
    playback.fadingOut = true;
    gain.gain.setValueAtTime(currentVolume, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeOutMs / 1000);
    source.stop(now + fadeOutMs / 1000 + 0.02);
    this.notify();
  }

  stopAll(tracks: Track[], fadeOutMs?: number): void {
    for (const track of tracks) this.stop(track.id, fadeOutMs ?? track.fadeOutMs);
  }

  async runAction(action: MouseAction, track: Track, projectTracks: Track[], volumeMultiplier = 1): Promise<void> {
    if (action === 'none') return;
    if (action === 'stop') return this.stop(track.id, track.fadeOutMs);
    if (action === 'start') return this.play(track, track.fadeInMs, volumeMultiplier);
    if (action === 'fade-in') return this.play(track, track.fadeInMs > 0 ? track.fadeInMs : 1_200, volumeMultiplier);
    await this.load(track);
    if (action === 'replace') this.stopAll(projectTracks, 0);
    else this.stopAll(projectTracks);
    await this.play(track, track.fadeInMs, volumeMultiplier);
  }

  private findPlayback(playbackId: string): Playback | undefined {
    for (const instances of this.active.values()) {
      const playback = [...instances].find((candidate) => candidate.id === playbackId);
      if (playback) return playback;
    }
    return undefined;
  }

  private startPlaybackSource(playback: Playback): void {
    const context = this.context;
    if (!context) return;
    const source = context.createBufferSource();
    source.buffer = playback.buffer;
    source.loop = playback.loop;
    if (playback.loop) {
      source.loopStart = playback.startAtSeconds;
      source.loopEnd = Math.max(playback.startAtSeconds + .01, playback.endAtSeconds);
    }
    source.connect(playback.gain);
    playback.source = source;
    playback.resumedAtMs = performance.now();
    source.onended = () => {
      if (playback.source !== source) return;
      playback.source = undefined;
      this.finishPlayback(playback, !playback.stopping && !playback.loop);
    };
    if (playback.loop) source.start(0, playback.positionSeconds);
    else source.start(0, playback.positionSeconds, Math.max(.01, playback.endAtSeconds - playback.positionSeconds));
  }

  private capturePosition(playback: Playback, preserveVolumeTransition = false): void {
    const source = playback.source;
    if (!source) return;
    const nowMs = performance.now();
    const currentVolume = preserveVolumeTransition ? undefined : playbackVolumeAt(playback, nowMs);
    const elapsedSeconds = Math.max(0, nowMs - playback.resumedAtMs) / 1_000;
    playback.elapsedMs += elapsedSeconds * 1_000;
    if (playback.loop) {
      const length = Math.max(.01, playback.endAtSeconds - playback.startAtSeconds);
      playback.positionSeconds = playback.startAtSeconds
        + ((playback.positionSeconds - playback.startAtSeconds + elapsedSeconds) % length);
    } else {
      playback.positionSeconds = Math.min(playback.endAtSeconds, playback.positionSeconds + elapsedSeconds);
    }
    playback.resumedAtMs = nowMs;
    playback.source = undefined;
    source.onended = null;
    try { source.stop(); } catch { /* La source peut déjà être terminée. */ }
    const context = this.context;
    if (context && currentVolume !== undefined) {
      const now = context.currentTime;
      playback.gain.gain.cancelScheduledValues(now);
      playback.gain.gain.setValueAtTime(currentVolume, now);
    }
    if (currentVolume !== undefined) {
      playback.volume = currentVolume;
      playback.volumeFrom = currentVolume;
      playback.volumeTransitionStartedAtMs = nowMs;
      playback.volumeTransitionDurationMs = 0;
    }
  }

  private currentElapsedMs(playback: Playback): number {
    return playback.paused ? playback.elapsedMs : playback.elapsedMs + Math.max(0, performance.now() - playback.resumedAtMs);
  }

  private finishPlayback(playback: Playback, completed: boolean): void {
    this.recordProgress(playback, completed ? 1 : this.currentElapsedMs(playback) / playback.durationMs);
    const instances = this.active.get(playback.trackId);
    instances?.delete(playback);
    if (!instances?.size) this.active.delete(playback.trackId);
    playback.source = undefined;
    playback.gain.disconnect();
    this.notify();
  }
}

export function playbackVolumeAt(playback: Pick<ActivePlayback, 'volume' | 'volumeFrom' | 'volumeTransitionStartedAtMs' | 'volumeTransitionDurationMs'>, atMs = performance.now()): number {
  if (playback.volumeTransitionDurationMs <= 0) return playback.volume;
  const progress = Math.min(1, Math.max(0, (atMs - playback.volumeTransitionStartedAtMs) / playback.volumeTransitionDurationMs));
  return playback.volumeFrom + (playback.volume - playback.volumeFrom) * progress;
}

function readHistory(): Map<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(historyStorageKey) ?? '{}') as Record<string, unknown>;
    return new Map(Object.entries(parsed).flatMap(([trackId, value]) => typeof value === 'number' && Number.isFinite(value)
      ? [[trackId, Math.min(1, Math.max(0, value))] as const]
      : []));
  } catch {
    return new Map();
  }
}

export const audioEngine = new AudioEngine();
