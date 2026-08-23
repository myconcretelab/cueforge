export interface User {
  id: string;
  email: string;
  displayName: string;
}

export type MouseAction = 'start' | 'crossfade' | 'fade-in' | 'replace' | 'stop' | 'none';
export type KeyAction = 'stop-all' | 'stop-all-immediate' | 'none';

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  leftClickAction: MouseAction;
  rightClickAction: MouseAction;
  escapeKeyAction: KeyAction;
  backspaceKeyAction: KeyAction;
  spaceKeyAction: KeyAction;
  position: number;
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

export interface ProjectColor {
  id: string;
  projectId: string;
  color: string;
  position: number;
}

export interface Playlist {
  id: string;
  projectId: string;
  name: string;
  color: string;
  autostart: boolean;
  loop: boolean;
  random: boolean;
  position: number;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
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
  colors: ProjectColor[];
  playlists: Playlist[];
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

export type FreesoundLicenseFilter = 'compatible' | 'cc0' | 'by';

export interface FreesoundSound {
  id: number;
  name: string;
  username: string;
  durationSeconds: number;
  previewUrl: string;
  pageUrl: string;
  tags: string[];
  license: {
    code: 'cc0' | 'by';
    label: string;
    url: string;
    attributionRequired: boolean;
  };
}

export interface FreesoundSearchResult {
  count: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  results: FreesoundSound[];
}

export type RemoteCommand =
  | { type: 'play'; trackId: string; volumeMultiplier?: number }
  | { type: 'stop'; trackId: string }
  | { type: 'stop-all' }
  | { type: 'stop-all-immediate' }
  | { type: 'run-action'; trackId: string; action: MouseAction; volumeMultiplier?: number };
