export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
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
  volume: number;
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
  position: number;
  createdAt: string;
}

export interface ProjectDetail {
  project: Project;
  categories: Category[];
  tracks: Track[];
}

export type RemoteCommand =
  | { type: 'play'; trackId: string }
  | { type: 'stop'; trackId: string }
  | { type: 'stop-all' };
