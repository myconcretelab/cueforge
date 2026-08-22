export interface User {
  id: string;
  email: string;
  displayName: string;
}

export type MouseAction = 'start' | 'crossfade' | 'fade-in' | 'replace' | 'stop' | 'none';
export type KeyAction = 'stop-all' | 'none';

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  leftClickAction: MouseAction;
  rightClickAction: MouseAction;
  escapeKeyAction: KeyAction;
  backspaceKeyAction: KeyAction;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  projectId: string;
  name: string;
  color: string;
  position: number;
}

export interface Track {
  id: string;
  projectId: string;
  categoryId: string | null;
  title: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  startTimeMs: number;
  endTimeMs: number | null;
  volume: number;
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
  color: string | null;
  description: string | null;
  copyrightText: string | null;
  sourceUrl: string | null;
  sourceId: string | null;
  position: number;
  createdAt: string;
}

export interface ProjectDetail {
  project: Project;
  categories: Category[];
  tracks: Track[];
}

export interface SoundShowTrack {
  sourceId: string;
  categorySourceId: string;
  title: string;
  path: string | null;
  url: string | null;
  durationMs: number | null;
  startTimeMs: number;
  endTimeMs: number | null;
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
  color: string | null;
  description: string | null;
  copyrightText: string | null;
  position: number;
}

export interface SoundShowAnalysis {
  name: string;
  releaseDate: string | null;
  relativePaths: boolean;
  categories: Array<{ sourceId: string; name: string; color: string; position: number }>;
  tracks: SoundShowTrack[];
  playlists: Array<{ name: string; sourceTrackIds: string[]; loop: boolean }>;
  warnings: string[];
}

export type RemoteCommand =
  | { type: 'play'; trackId: string }
  | { type: 'stop'; trackId: string }
  | { type: 'stop-all' }
  | { type: 'run-action'; trackId: string; action: MouseAction };
