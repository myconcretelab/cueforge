import type { MouseAction, Track } from '../types';

export interface ActivePlayback {
  id: string;
  trackId: string;
  sequence: number;
  startedAtMs: number;
  durationMs: number;
  loop: boolean;
}

interface Playback extends ActivePlayback {
  source: AudioBufferSourceNode;
  gain: GainNode;
  stopping: boolean;
}

type Listener = (playbacks: ActivePlayback[]) => void;
type CacheListener = (loadedTrackIds: Set<string>) => void;

class AudioEngine {
  private context?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<AudioBuffer>>();
  private active = new Map<string, Set<Playback>>();
  private listeners = new Set<Listener>();
  private cacheListeners = new Set<CacheListener>();
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

  private getActivePlaybacks(): ActivePlayback[] {
    return [...this.active.values()]
      .flatMap((instances) => [...instances])
      .map(({ id, trackId, sequence, startedAtMs, durationMs, loop }) => ({ id, trackId, sequence, startedAtMs, durationMs, loop }))
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
        const response = await fetch(`/api/tracks/${track.id}/stream`, { credentials: 'include' });
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

  async play(track: Track, fadeInMs = track.fadeInMs): Promise<void> {
    const [context, buffer] = await Promise.all([this.getContext(), this.load(track)]);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = track.loop;
    const startAt = Math.min(track.startTimeMs / 1000, Math.max(0, buffer.duration - 0.01));
    const endAt = track.endTimeMs ? Math.min(track.endTimeMs / 1000, buffer.duration) : buffer.duration;
    if (track.loop) {
      source.loopStart = startAt;
      source.loopEnd = Math.max(startAt + 0.01, endAt);
    }
    source.connect(gain).connect(context.destination);
    const now = context.currentTime;
    if (fadeInMs > 0) {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(track.volume, now + fadeInMs / 1000);
    } else {
      gain.gain.setValueAtTime(track.volume, now);
    }
    const sequence = ++this.playbackSequence;
    const playback: Playback = {
      id: `${track.id}:${sequence}`,
      trackId: track.id,
      sequence,
      startedAtMs: performance.now(),
      durationMs: Math.max(10, (endAt - startAt) * 1_000),
      loop: track.loop,
      source,
      gain,
      stopping: false,
    };
    const instances = this.active.get(track.id) ?? new Set<Playback>();
    instances.add(playback);
    this.active.set(track.id, instances);
    source.onended = () => {
      instances.delete(playback);
      if (!instances.size) this.active.delete(track.id);
      this.notify();
    };
    if (track.loop) source.start(0, startAt);
    else source.start(0, startAt, Math.max(0.01, endAt - startAt));
    this.notify();
  }

  stop(trackId: string, fadeOutMs = 250): void {
    const context = this.context;
    const instances = this.active.get(trackId);
    if (!context || !instances) return;
    for (const playback of instances) this.stopPlayback(playback, fadeOutMs);
  }

  stopInstance(playbackId: string, fadeOutMs = 250): void {
    for (const instances of this.active.values()) {
      const playback = [...instances].find((candidate) => candidate.id === playbackId);
      if (playback) {
        this.stopPlayback(playback, fadeOutMs);
        return;
      }
    }
  }

  private stopPlayback(playback: Playback, fadeOutMs: number): void {
    const context = this.context;
    if (!context || playback.stopping) return;
    playback.stopping = true;
    const { source, gain } = playback;
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    if (fadeOutMs <= 0) {
      gain.gain.setValueAtTime(0, now);
      source.stop(now);
      return;
    }
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeOutMs / 1000);
    source.stop(now + fadeOutMs / 1000 + 0.02);
  }

  stopAll(tracks: Track[], fadeOutMs?: number): void {
    for (const track of tracks) this.stop(track.id, fadeOutMs ?? track.fadeOutMs);
  }

  async runAction(action: MouseAction, track: Track, projectTracks: Track[]): Promise<void> {
    if (action === 'none') return;
    if (action === 'stop') return this.stop(track.id, track.fadeOutMs);
    if (action === 'start') return this.play(track);
    if (action === 'fade-in') return this.play(track, track.fadeInMs > 0 ? track.fadeInMs : 1_200);
    await this.load(track);
    if (action === 'replace') this.stopAll(projectTracks, 0);
    else this.stopAll(projectTracks);
    await this.play(track);
  }
}

export const audioEngine = new AudioEngine();
