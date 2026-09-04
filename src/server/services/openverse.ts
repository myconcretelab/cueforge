import { z } from 'zod';

export const openverseSources = ['freesound', 'jamendo', 'wikimedia_audio', 'ccmixter'] as const;

export type OpenverseSource = typeof openverseSources[number];
export type OpenverseLicenseFilter = 'all' | 'cc0' | 'by';

export interface OpenverseSound {
  id: string;
  name: string;
  username: string;
  durationSeconds: number;
  previewUrl: string;
  pageUrl: string;
  tags: string[];
  source: OpenverseSource;
  sourceLabel: string;
  license: {
    code: string;
    label: string;
    url: string;
    attributionRequired: boolean;
  };
}

export interface OpenverseSearchResult {
  count: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  results: OpenverseSound[];
}

interface OpenverseSearchInput {
  query: string;
  license: OpenverseLicenseFilter;
  sources: OpenverseSource[];
  page: number;
  clientId?: string;
  clientSecret?: string;
}

const pageSize = 24;
const sourceLabels: Record<OpenverseSource, string> = {
  freesound: 'Freesound',
  jamendo: 'Jamendo',
  wikimedia_audio: 'Wikimedia',
  ccmixter: 'ccMixter',
};
const upstreamSchema = z.object({
  result_count: z.number().int().nonnegative(),
  page_count: z.number().int().nonnegative(),
  results: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().nullish(),
    creator: z.string().nullish(),
    duration: z.number().nonnegative().nullish(),
    url: z.string().url().nullish(),
    foreign_landing_url: z.string().url().nullish(),
    license: z.string().min(1),
    license_version: z.string().nullish(),
    license_url: z.string().url().nullish(),
    source: z.string(),
    tags: z.array(z.object({ name: z.string() })).nullish(),
  })),
});
const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});

let cachedToken: { value: string; expiresAt: number } | undefined;

export function buildOpenverseSearchUrl(input: Pick<OpenverseSearchInput, 'query' | 'license' | 'sources' | 'page'>): URL {
  const url = new URL('https://api.openverse.org/v1/audio/');
  url.searchParams.set('q', input.query);
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('page', String(input.page));
  url.searchParams.set('source', input.sources.join(','));
  if (input.license !== 'all') url.searchParams.set('license', input.license);
  return url;
}

export async function searchOpenverse(
  input: OpenverseSearchInput,
  fetcher: typeof fetch = fetch,
): Promise<OpenverseSearchResult> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (input.clientId && input.clientSecret) {
    headers.Authorization = `Bearer ${await openverseAccessToken(input.clientId, input.clientSecret, fetcher)}`;
  }
  const response = await fetcher(buildOpenverseSearchUrl(input), {
    headers,
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Openverse a répondu avec le statut ${response.status}.`);
  const upstream = upstreamSchema.parse(await response.json());
  const results = upstream.results.flatMap((sound) => {
    if (!isOpenverseSource(sound.source) || !sound.url || !sound.foreign_landing_url) return [];
    if (!isAllowedOpenverseAudioUrl(sound.url)) return [];
    const licenseUrl = sound.license_url ?? 'https://creativecommons.org/licenses/';
    return [{
      id: sound.id,
      name: sound.title?.trim() || 'Son sans titre',
      username: sound.creator?.trim() || 'Auteur inconnu',
      durationSeconds: (sound.duration ?? 0) / 1_000,
      previewUrl: sound.url,
      pageUrl: sound.foreign_landing_url,
      tags: (sound.tags ?? []).map((tag) => tag.name).slice(0, 12),
      source: sound.source,
      sourceLabel: sourceLabels[sound.source],
      license: {
        code: sound.license,
        label: formatLicense(sound.license, sound.license_version),
        url: licenseUrl,
        attributionRequired: sound.license !== 'cc0',
      },
    } satisfies OpenverseSound];
  });
  return {
    count: upstream.result_count,
    page: input.page,
    pageSize,
    hasNext: input.page < upstream.page_count,
    results,
  };
}

export function isAllowedOpenverseAudioUrl(value: string): boolean {
  const url = new URL(value);
  if (url.protocol !== 'https:') return false;
  return url.hostname === 'cdn.freesound.org'
    || /^prod-\d+\.storage\.jamendo\.com$/.test(url.hostname)
    || url.hostname === 'upload.wikimedia.org'
    || url.hostname === 'ccmixter.org'
    || url.hostname.endsWith('.ccmixter.org');
}

function isOpenverseSource(value: string): value is OpenverseSource {
  return (openverseSources as readonly string[]).includes(value);
}

function formatLicense(code: string, version?: string | null): string {
  const normalized = code.toUpperCase().replaceAll('-', ' ');
  return `CC ${normalized}${version ? ` ${version}` : ''}`;
}

async function openverseAccessToken(clientId: string, clientSecret: string, fetcher: typeof fetch): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const response = await fetcher('https://api.openverse.org/v1/auth_tokens/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Authentification Openverse refusée avec le statut ${response.status}.`);
  const token = tokenSchema.parse(await response.json());
  cachedToken = { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1_000 };
  return token.access_token;
}
