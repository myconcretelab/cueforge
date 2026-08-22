import { z } from 'zod';

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

interface FreesoundSearchInput {
  apiKey: string;
  query: string;
  license: FreesoundLicenseFilter;
  maxDuration?: number;
  page: number;
}

const pageSize = 24;
const upstreamSchema = z.object({
  count: z.number().int().nonnegative(),
  results: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string(),
    username: z.string(),
    duration: z.number().nonnegative(),
    license: z.string().url(),
    url: z.string().url(),
    tags: z.array(z.string()).default([]),
    previews: z.record(z.string(), z.string()),
  })),
});

const licenseFilters: Record<FreesoundLicenseFilter, string> = {
  compatible: 'license:("Creative Commons 0" OR "Attribution")',
  cc0: 'license:"Creative Commons 0"',
  by: 'license:"Attribution"',
};

export function buildFreesoundSearchUrl(input: Omit<FreesoundSearchInput, 'apiKey'>): URL {
  const url = new URL('https://freesound.org/apiv2/search/');
  url.searchParams.set('query', input.query);
  url.searchParams.set('fields', 'id,name,username,license,duration,previews,url,tags');
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('page', String(input.page));
  url.searchParams.set('sort', 'score');
  const filters = [licenseFilters[input.license]];
  if (input.maxDuration) filters.push(`duration:[0 TO ${input.maxDuration}]`);
  url.searchParams.set('filter', filters.join(' '));
  return url;
}

export async function searchFreesound(
  input: FreesoundSearchInput,
  fetcher: typeof fetch = fetch,
): Promise<FreesoundSearchResult> {
  const response = await fetcher(buildFreesoundSearchUrl(input), {
    headers: { Authorization: `Token ${input.apiKey}` },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Freesound a répondu avec le statut ${response.status}.`);
  const upstream = upstreamSchema.parse(await response.json());
  const results = upstream.results.flatMap((sound) => {
    const previewUrl = sound.previews['preview-hq-mp3'] ?? sound.previews['preview-hq-ogg'];
    const license = normalizeLicense(sound.license);
    if (!previewUrl || !license || !isAllowedFreesoundUrl(previewUrl) || !isAllowedFreesoundUrl(sound.url)) return [];
    return [{
      id: sound.id,
      name: sound.name,
      username: sound.username,
      durationSeconds: sound.duration,
      previewUrl,
      pageUrl: sound.url,
      tags: sound.tags.slice(0, 12),
      license,
    } satisfies FreesoundSound];
  });
  return {
    count: upstream.count,
    page: input.page,
    pageSize,
    hasNext: input.page * pageSize < upstream.count,
    results,
  };
}

function normalizeLicense(url: string): FreesoundSound['license'] | undefined {
  if (url.includes('/publicdomain/zero/')) {
    return { code: 'cc0', label: 'CC0', url, attributionRequired: false };
  }
  if (url.includes('/licenses/by/')) {
    const version = url.match(/\/by\/(\d+(?:\.\d+)?)\//)?.[1];
    return { code: 'by', label: version ? `CC BY ${version}` : 'CC BY', url, attributionRequired: true };
  }
  return undefined;
}

function isAllowedFreesoundUrl(value: string): boolean {
  const url = new URL(value);
  return url.protocol === 'https:' && (url.hostname === 'freesound.org' || url.hostname.endsWith('.freesound.org'));
}
