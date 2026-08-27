import type { AccountSummary, AdminAccount, AdminOverview, AdminReleaseInfo, AdminUser, AuditEntry, Category, CommercialPlan, FreesoundLicenseFilter, FreesoundSearchResult, KeyAction, MouseAction, Playlist, Project, ProjectColor, ProjectDetail, PublicPlan, ReleaseInfo, SoundShowAnalysis, Track, User } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const hasJsonBody = init?.body !== undefined && init.body !== null && !(init.body instanceof FormData);
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: hasJsonBody ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
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
  startDemo: () => request<{ user: User }>('/api/auth/demo', { method: 'POST' }),
  resetDemo: () => request<{ user: User }>('/api/auth/demo/reset', { method: 'POST' }),
  register: (input: { displayName: string; email: string; password: string; planCode: string; billingInterval: 'month' | 'year'; requestId: string }) =>
    request<{ user: User; checkoutUrl: string | null; checkoutError?: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request<void>('/api/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  version: () => request<{ version: string; releasedAt: string }>('/api/version'),
  releases: () => request<ReleaseInfo>('/api/releases'),
  markReleaseSeen: (version: string) => request<void>(`/api/releases/${encodeURIComponent(version)}/seen`, { method: 'POST' }),
  account: () => request<{ account: AccountSummary }>('/api/account'),
  publicPlans: () => request<{ currency: string; signupUrl: string; plans: PublicPlan[] }>('/api/public/plans'),
  createCheckout: (input: { planCode: string; billingInterval: 'month' | 'year'; requestId: string }) =>
    request<{ url: string }>('/api/billing/checkout', { method: 'POST', body: JSON.stringify(input) }),
  createBillingPortal: () => request<{ url: string }>('/api/billing/portal', { method: 'POST' }),
  adminOverview: () => request<{ overview: AdminOverview; recentAudit: AuditEntry[] }>('/api/admin/overview'),
  adminReleases: () => request<AdminReleaseInfo>('/api/admin/releases'),
  adminAccounts: (search = '') => request<{ accounts: AdminAccount[] }>(`/api/admin/accounts?search=${encodeURIComponent(search)}`),
  adminAccount: (id: string) => request<Record<string, unknown>>(`/api/admin/accounts/${id}`),
  updateAdminAccount: (id: string, input: Record<string, unknown>) => request<{ account: AdminAccount }>(`/api/admin/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  adminUsers: (search = '') => request<{ users: AdminUser[] }>(`/api/admin/users?search=${encodeURIComponent(search)}`),
  updateAdminUser: (id: string, input: { platformRole?: User['platformRole']; disabled?: boolean }) => request<{ user: AdminUser }>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  adminPlans: () => request<{ plans: CommercialPlan[] }>('/api/admin/plans'),
  createAdminPlan: (input: Omit<CommercialPlan, 'accountCount' | 'createdAt' | 'updatedAt'>) => request<{ plan: CommercialPlan }>('/api/admin/plans', { method: 'POST', body: JSON.stringify(input) }),
  updateAdminPlan: (code: string, input: Partial<Omit<CommercialPlan, 'code' | 'accountCount' | 'createdAt' | 'updatedAt'>>) => request<{ plan: CommercialPlan }>(`/api/admin/plans/${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteAdminPlan: (code: string) => request<void>(`/api/admin/plans/${encodeURIComponent(code)}`, { method: 'DELETE' }),
  syncAdminPlanStripe: (code: string) => request<{ billing: { environment: 'test' | 'live'; productId: string; monthlyPriceId: string | null; annualPriceId: string | null } }>(`/api/admin/plans/${encodeURIComponent(code)}/stripe-sync`, { method: 'POST' }),
  reconcileAdminAccountStripe: (id: string) => request<void>(`/api/admin/accounts/${id}/stripe-reconcile`, { method: 'POST' }),
  projects: () => request<{ projects: Project[] }>('/api/projects'),
  createProject: (name: string) => request<{ project: Project }>('/api/projects', {
    method: 'POST', body: JSON.stringify({ name }),
  }),
  reorderProjects: (projectIds: string[]) => request<{ projects: Project[] }>('/api/projects/reorder', {
    method: 'PATCH', body: JSON.stringify({ projectIds }),
  }),
  deleteProject: (id: string) => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  project: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),
  updateProjectActions: (projectId: string, input: { leftClickAction?: MouseAction; rightClickAction?: MouseAction; escapeKeyAction?: KeyAction; backspaceKeyAction?: KeyAction; spaceKeyAction?: KeyAction }) =>
    request<{ project: Project }>(`/api/projects/${projectId}/mouse-actions`, { method: 'PATCH', body: JSON.stringify(input) }),
  createProjectColor: (projectId: string, color: string) => request<{ projectColor: ProjectColor }>(`/api/projects/${projectId}/colors`, {
    method: 'POST', body: JSON.stringify({ color }),
  }),
  reorderProjectColors: (projectId: string, colorIds: string[]) => request<{ colors: ProjectColor[] }>(`/api/projects/${projectId}/colors/reorder`, {
    method: 'PATCH', body: JSON.stringify({ colorIds }),
  }),
  deleteProjectColor: (projectId: string, colorId: string) => request<void>(`/api/projects/${projectId}/colors/${colorId}`, { method: 'DELETE' }),
  savePlaylist: (projectId: string, playlistId: string | undefined, input: Pick<Playlist, 'name' | 'color' | 'autostart' | 'loop' | 'random' | 'gapMs' | 'crossfadeMs' | 'trackIds' | 'categoryId'>) =>
    request<{ playlist: Playlist }>(playlistId ? `/api/projects/${projectId}/playlists/${playlistId}` : `/api/projects/${projectId}/playlists`, {
      method: playlistId ? 'PATCH' : 'POST', body: JSON.stringify(input),
    }),
  positionPlaylist: (projectId: string, playlistId: string, position: number, categoryId?: string | null) => request<{ playlist: Playlist }>(`/api/projects/${projectId}/playlists/${playlistId}/position`, {
    method: 'PATCH', body: JSON.stringify(categoryId === undefined ? { position } : { position, categoryId }),
  }),
  deletePlaylist: (projectId: string, playlistId: string) => request<void>(`/api/projects/${projectId}/playlists/${playlistId}`, { method: 'DELETE' }),
  createCategory: (projectId: string, name: string, color: string, position?: number) =>
    request<{ category: Category }>(`/api/projects/${projectId}/categories`, {
      method: 'POST', body: JSON.stringify({ name, color, position }),
    }),
  reorderCategories: (projectId: string, categoryIds: string[]) => request<{ categories: Category[] }>(`/api/projects/${projectId}/categories/reorder`, {
    method: 'PATCH', body: JSON.stringify({ categoryIds }),
  }),
  deleteCategory: (projectId: string, categoryId: string) => request<void>(`/api/projects/${projectId}/categories/${categoryId}`, { method: 'DELETE' }),
  uploadTrack: (form: FormData) => request<{ track: Track }>('/api/tracks/upload', { method: 'POST', body: form }),
  updateTrack: (id: string, input: Partial<Pick<Track, 'title' | 'categoryId' | 'volume' | 'loop' | 'fadeInMs' | 'fadeOutMs' | 'startTimeMs' | 'endTimeMs' | 'color'>>) =>
    request<{ track: Track }>(`/api/tracks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  reorderTrack: (id: string, input: { categoryId: string | null; beforeTrackId?: string | null }) =>
    request<{ tracks: Track[] }>(`/api/tracks/${id}/reorder`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteTrack: (id: string) => request<void>(`/api/tracks/${id}`, { method: 'DELETE' }),
  analyzeSoundShow: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ analysis: SoundShowAnalysis }>('/api/imports/soundshow/analyze', { method: 'POST', body: form });
  },
  importRemoteTrack: (input: Record<string, unknown>) => request<{ track: Track }>('/api/tracks/import-remote', {
    method: 'POST', body: JSON.stringify(input),
  }),
  searchFreesound: (input: { query: string; license: FreesoundLicenseFilter; minDuration?: number; maxDuration?: number; page?: number }, signal?: AbortSignal) => {
    const parameters = new URLSearchParams({
      q: input.query,
      license: input.license,
      page: String(input.page ?? 1),
    });
    if (input.minDuration) parameters.set('minDuration', String(input.minDuration));
    if (input.maxDuration) parameters.set('maxDuration', String(input.maxDuration));
    return request<FreesoundSearchResult>(`/api/freesound/search?${parameters}`, { signal });
  },
};
