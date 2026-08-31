import type { Track } from '../types';

export type AudioPlaybackMode = 'browser' | 'bridge';

export interface BridgeStatus {
  version: string;
  paired: boolean;
  serverUrl: string | null;
  deviceId: string | null;
  cachedTracks: number;
  cachedBytes?: number;
  capabilities?: string[];
}

export interface BridgeOutput {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface BridgePlayback {
  id: string;
  trackId: string;
  sequence: number;
  positionMs: number;
  durationMs: number;
  loopPlayback: boolean;
  paused: boolean;
  volume: number;
  fadingOut: boolean;
  channel: 'main' | 'preview';
  outputId?: string;
}

interface BridgeAssociation {
  deviceId: string;
  localToken: string;
}

type PlaybackListener = (playbacks: BridgePlayback[]) => void;
type CacheListener = (trackIds: Set<string>) => void;
type RoutingListener = () => void;

const bridgeBaseUrl = 'http://127.0.0.1:43821';
const associationStorageKey = 'sonoriva-bridge-association-v1';
const modeStorageKey = 'sonoriva-audio-mode-v1';

class BridgeClient {
  private association = readAssociation();
  private mode: AudioPlaybackMode = readMode();
  private playbacks: BridgePlayback[] = [];
  private cachedTrackIds = new Set<string>();
  private playbackListeners = new Set<PlaybackListener>();
  private cacheListeners = new Set<CacheListener>();
  private routingListeners = new Set<RoutingListener>();
  private polling?: number;
  private socket?: WebSocket;

  getMode(): AudioPlaybackMode { return this.mode; }
  isEnabled(): boolean { return this.mode === 'bridge' && Boolean(this.association); }
  isAssociated(): boolean { return Boolean(this.association); }
  getDeviceId(): string | null { return this.association?.deviceId ?? null; }
  getPlaybacks(): BridgePlayback[] { return this.playbacks.map((playback) => ({ ...playback })); }
  getCachedTrackIds(): Set<string> { return new Set(this.cachedTrackIds); }

  setMode(mode: AudioPlaybackMode): void {
    if (mode === 'bridge' && !this.association) throw new Error('Associez d’abord SonoRiva Bridge à ce navigateur.');
    this.mode = mode;
    localStorage.setItem(modeStorageKey, mode);
    if (mode === 'bridge') this.startPolling();
    else this.stopPolling();
    this.notifyPlaybacks();
    this.notifyCache();
    this.notifyRouting();
  }

  saveAssociation(deviceId: string, localToken: string): void {
    this.association = { deviceId, localToken };
    localStorage.setItem(associationStorageKey, JSON.stringify(this.association));
    this.notifyRouting();
  }

  forgetAssociation(): void {
    this.stopPolling();
    this.association = undefined;
    this.mode = 'browser';
    this.playbacks = [];
    this.cachedTrackIds.clear();
    localStorage.removeItem(associationStorageKey);
    localStorage.setItem(modeStorageKey, 'browser');
    this.notifyPlaybacks();
    this.notifyCache();
    this.notifyRouting();
  }

  async discover(signal?: AbortSignal): Promise<BridgeStatus> {
    return this.request<BridgeStatus>('/v1/status', { signal }, false);
  }

  async outputs(): Promise<{ outputs: BridgeOutput[]; mainOutputId: string; previewOutputId: string }> {
    return this.request('/v1/outputs');
  }

  async setOutput(channel: 'main' | 'preview', deviceId: string): Promise<void> {
    await this.request(`/v1/outputs/${channel}`, { method: 'PUT', body: JSON.stringify({ deviceId }) });
    this.notifyRouting();
  }

  async syncProject(projectId: string): Promise<number> {
    const result = await this.request<{ cached: number }>(`/v1/projects/${encodeURIComponent(projectId)}/sync`, { method: 'POST' });
    return result.cached;
  }

  async preload(track: Track): Promise<void> {
    await this.request('/v1/cache', { method: 'POST', body: JSON.stringify(track) });
    this.cachedTrackIds.add(track.id);
    this.notifyCache();
  }

  async play(track: Track, fadeInMs: number, volumeMultiplier: number, channel: 'main' | 'preview' = 'main', outputId?: string): Promise<string> {
    const result = await this.request<{ playbackId: string }>('/v1/play', {
      method: 'POST',
      body: JSON.stringify({ track, fadeInMs, volumeMultiplier, channel, outputId }),
    });
    await this.refreshPlaybacks();
    return result.playbackId;
  }

  async playRemotePreview(input: { id: number; name: string; url: string; durationMs: number; volume: number }, outputId?: string): Promise<string> {
    const track = {
      id: `freesound-${input.id}`,
      projectId: '',
      categoryId: null,
      title: input.name,
      originalFilename: input.name,
      mimeType: 'audio/mpeg',
      sizeBytes: 0,
      durationMs: input.durationMs,
      startTimeMs: 0,
      endTimeMs: null,
      volume: input.volume,
      loop: false,
      fadeInMs: 0,
      fadeOutMs: 0,
      color: null,
      tags: [],
      description: null,
      copyrightText: null,
      sourceUrl: input.url,
      sourceId: `freesound:${input.id}`,
      position: 0,
      createdAt: new Date().toISOString(),
    } satisfies Track;
    const result = await this.request<{ playbackId: string }>('/v1/play', {
      method: 'POST',
      body: JSON.stringify({ track, fadeInMs: 0, volumeMultiplier: 1, channel: 'preview', outputId, remotePreview: { id: input.id, url: input.url } }),
    });
    await this.refreshPlaybacks();
    return result.playbackId;
  }

  togglePause(id: string): void { this.send(`/v1/playbacks/${encodeURIComponent(id)}/pause`, 'POST'); }
  setVolume(id: string, volume: number): void { this.send(`/v1/playbacks/${encodeURIComponent(id)}/volume`, 'PUT', { volume }); }
  setMasterVolume(volume: number): void { this.send('/v1/master-volume', 'PUT', { volume }); }
  setLoop(id: string, loop: boolean): void { this.send(`/v1/playbacks/${encodeURIComponent(id)}/loop`, 'PUT', { loop }); }
  seek(id: string, progress: number): void { this.send(`/v1/playbacks/${encodeURIComponent(id)}/seek`, 'PUT', { progress }); }
  async setPlaybackOutput(id: string, deviceId: string): Promise<void> {
    await this.request(`/v1/playbacks/${encodeURIComponent(id)}/output`, { method: 'PUT', body: JSON.stringify({ deviceId }) });
    await this.refreshPlaybacks();
  }
  stop(id: string, fadeOutMs: number): void { this.send(`/v1/playbacks/${encodeURIComponent(id)}/stop`, 'POST', { fadeOutMs }); }
  stopTrack(trackId: string, fadeOutMs: number): void { this.send('/v1/stop-track', 'POST', { trackId, fadeOutMs }); }
  stopAll(fadeOutMs: number): void { this.send('/v1/stop-all', 'POST', { fadeOutMs }); }

  subscribe(listener: PlaybackListener): () => void {
    this.playbackListeners.add(listener);
    listener(this.getPlaybacks());
    if (this.isEnabled()) this.startPolling();
    return () => {
      this.playbackListeners.delete(listener);
      if (!this.playbackListeners.size) this.stopPolling();
    };
  }

  subscribeCache(listener: CacheListener): () => void {
    this.cacheListeners.add(listener);
    listener(this.getCachedTrackIds());
    return () => this.cacheListeners.delete(listener);
  }

  subscribeRouting(listener: RoutingListener): () => void {
    this.routingListeners.add(listener);
    listener();
    return () => this.routingListeners.delete(listener);
  }

  private startPolling(): void {
    if (this.polling || this.socket || typeof window === 'undefined') return;
    if (typeof WebSocket !== 'undefined' && this.association) {
      try {
        const socket = new WebSocket('ws://127.0.0.1:43821/v1/events');
        this.socket = socket;
        socket.addEventListener('open', () => socket.send(JSON.stringify({ type: 'authenticate', token: this.association?.localToken })));
        socket.addEventListener('message', (event) => {
          try {
            const payload = JSON.parse(String(event.data)) as { type?: string; playbacks?: BridgePlayback[] };
            if (payload.type === 'playbacks' && Array.isArray(payload.playbacks)) {
              this.playbacks = payload.playbacks;
              this.notifyPlaybacks();
            }
          } catch { /* Un message local invalide est ignoré. */ }
        });
        const fallback = () => {
          if (this.socket !== socket) return;
          this.socket = undefined;
          if (this.isEnabled() && this.playbackListeners.size) this.startHttpPolling();
        };
        socket.addEventListener('error', fallback, { once: true });
        socket.addEventListener('close', fallback, { once: true });
        return;
      } catch {
        this.socket = undefined;
      }
    }
    this.startHttpPolling();
  }

  private startHttpPolling(): void {
    if (this.polling || typeof window === 'undefined') return;
    this.refreshPlaybacks().catch(() => undefined);
    this.polling = window.setInterval(() => this.refreshPlaybacks().catch(() => undefined), 250);
  }

  private stopPolling(): void {
    if (this.socket) {
      const socket = this.socket;
      this.socket = undefined;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
    if (this.polling !== undefined) window.clearInterval(this.polling);
    this.polling = undefined;
  }

  private async refreshPlaybacks(): Promise<void> {
    if (!this.isEnabled()) return;
    const result = await this.request<{ playbacks: BridgePlayback[] }>('/v1/playbacks');
    this.playbacks = result.playbacks;
    this.notifyPlaybacks();
  }

  private send(path: string, method: 'POST' | 'PUT', body?: unknown): void {
    this.request(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })
      .then(() => this.refreshPlaybacks())
      .catch(() => undefined);
  }

  private notifyPlaybacks(): void {
    const playbacks = this.getPlaybacks();
    this.playbackListeners.forEach((listener) => listener(playbacks));
  }

  private notifyCache(): void {
    const cached = this.getCachedTrackIds();
    this.cacheListeners.forEach((listener) => listener(cached));
  }

  private notifyRouting(): void {
    this.routingListeners.forEach((listener) => listener());
  }

  private async request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
    if (authenticated && !this.association) throw new Error('SonoRiva Bridge n’est pas associé à ce navigateur.');
    const response = await fetch(`${bridgeBaseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(authenticated ? { Authorization: `Bearer ${this.association!.localToken}` } : {}),
        ...init.headers,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'SonoRiva Bridge ne répond pas.' }));
      throw new Error(body.error ?? 'SonoRiva Bridge ne répond pas.');
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}

function readAssociation(): BridgeAssociation | undefined {
  try {
    const parsed = JSON.parse(localStorage.getItem(associationStorageKey) ?? '{}') as Partial<BridgeAssociation>;
    if (typeof parsed.deviceId === 'string' && typeof parsed.localToken === 'string') {
      return { deviceId: parsed.deviceId, localToken: parsed.localToken };
    }
  } catch { /* L’association pourra être recréée. */ }
  return undefined;
}

function readMode(): AudioPlaybackMode {
  try {
    return localStorage.getItem(modeStorageKey) === 'bridge' && readAssociation() ? 'bridge' : 'browser';
  } catch {
    return 'browser';
  }
}

export const bridgeClient = new BridgeClient();
