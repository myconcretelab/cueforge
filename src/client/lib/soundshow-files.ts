import type { SoundShowTrack } from '../types';

const audioExtensions = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']);

export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/') || audioExtensions.has(file.name.split('.').pop()?.toLowerCase() ?? '');
}

export function findSoundShowFile(track: SoundShowTrack, files: File[]): File | undefined {
  if (!track.path) return undefined;
  const target = pathSegments(track.path);
  const targetName = target.at(-1);
  if (!targetName) return undefined;
  const candidates = files.filter((file) => isAudioFile(file) && normalize(file.name) === targetName);
  if (candidates.length === 1) return candidates[0];
  return candidates
    .map((file) => ({ file, score: suffixScore(target, pathSegments(file.webkitRelativePath || file.name)) }))
    .sort((a, b) => b.score - a.score)[0]?.file;
}

export function isSupportedRemote(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'cdn.freesound.org';
  } catch {
    return false;
  }
}

function pathSegments(value: string): string[] {
  return value.replaceAll('\\', '/').split('/').filter((segment) => segment && segment !== '..' && segment !== '.').map(normalize);
}

function normalize(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase('fr');
}

function suffixScore(target: string[], candidate: string[]): number {
  let score = 0;
  while (score < target.length && score < candidate.length && target.at(-1 - score) === candidate.at(-1 - score)) score += 1;
  return score;
}
