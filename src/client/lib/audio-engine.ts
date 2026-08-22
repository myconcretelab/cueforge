import type { Track } from '../types';

interface Playback {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

type Listener = (activeTrackIds: Set<string>) => void;

class AudioEngine {
  private context?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<AudioBuffer>>();
  private active = new Map<string, Set<Playback>>();
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(new Set(this.active.keys()));
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const ids = new Set(this.active.keys());
    this.listeners.forEach((listener) => listener(ids));
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
      const context = await this.getContext();
      const response = await fetch(`/api/tracks/${track.id}/stream`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Impossible de charger « ${track.title} »`);
      const decoded = await context.decodeAudioData(await response.arrayBuffer());
      this.buffers.set(track.id, decoded);
      this.pending.delete(track.id);
      return decoded;
    })();
    this.pending.set(track.id, loading);
    return loading;
  }

  async preload(track: Track): Promise<void> {
    await this.load(track);
  }

  async play(track: Track): Promise<void> {
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
    if (track.fadeInMs > 0) {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(track.volume, now + track.fadeInMs / 1000);
    } else {
      gain.gain.setValueAtTime(track.volume, now);
    }
    const playback = { source, gain };
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
    const now = context.currentTime;
    for (const { source, gain } of instances) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + fadeOutMs / 1000);
      source.stop(now + fadeOutMs / 1000 + 0.02);
    }
  }

  stopAll(tracks: Track[]): void {
    for (const track of tracks) this.stop(track.id, track.fadeOutMs);
  }
}

export const audioEngine = new AudioEngine();
