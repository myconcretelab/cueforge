import type { Category, Project, ProjectDetail, SoundShowAnalysis, Track, User } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'La requête a échoué.' }));
    throw new ApiError(body.error ?? 'La requête a échoué.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<{ user: User }>('/api/auth/me'),
  register: (input: { displayName: string; email: string; password: string }) =>
    request<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  projects: () => request<{ projects: Project[] }>('/api/projects'),
  createProject: (name: string) => request<{ project: Project }>('/api/projects', {
    method: 'POST', body: JSON.stringify({ name }),
  }),
  project: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),
  createCategory: (projectId: string, name: string, color: string, position?: number) =>
    request<{ category: Category }>(`/api/projects/${projectId}/categories`, {
      method: 'POST', body: JSON.stringify({ name, color, position }),
    }),
  uploadTrack: (form: FormData) => request<{ track: Track }>('/api/tracks/upload', { method: 'POST', body: form }),
  updateTrack: (id: string, input: Partial<Pick<Track, 'title' | 'categoryId' | 'volume' | 'loop' | 'fadeInMs' | 'fadeOutMs' | 'startTimeMs' | 'endTimeMs'>>) =>
    request<{ track: Track }>(`/api/tracks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteTrack: (id: string) => request<void>(`/api/tracks/${id}`, { method: 'DELETE' }),
  analyzeSoundShow: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ analysis: SoundShowAnalysis }>('/api/imports/soundshow/analyze', { method: 'POST', body: form });
  },
  importRemoteTrack: (input: Record<string, unknown>) => request<{ track: Track }>('/api/tracks/import-remote', {
    method: 'POST', body: JSON.stringify(input),
  }),
};
