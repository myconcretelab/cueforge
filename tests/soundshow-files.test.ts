import { describe, expect, it } from 'vitest';
import { findSoundShowFile, isSupportedRemote } from '../src/client/lib/soundshow-files.js';
import type { SoundShowTrack } from '../src/client/types.js';

const track: SoundShowTrack = {
  sourceId: 'one',
  categorySourceId: 'category',
  title: 'Petits papiers',
  path: '../../web-music/songs/HK - Les petits papiers.mp3',
  url: null,
  durationMs: 1_000,
  startTimeMs: 0,
  endTimeMs: null,
  loop: false,
  fadeInMs: 0,
  fadeOutMs: 0,
  color: null,
  description: null,
  copyrightText: null,
  position: 0,
};

function browserFile(name: string, relativePath: string): File {
  return { name, webkitRelativePath: relativePath, type: 'audio/mpeg' } as File;
}

describe('SoundShow file matching', () => {
  it('retrouve un média dans un dossier externe par suffixe de chemin', () => {
    const file = browserFile('HK - Les petits papiers.mp3', 'web-music/songs/HK - Les petits papiers.mp3');
    expect(findSoundShowFile(track, [file])).toBe(file);
  });

  it('limite les imports distants au CDN Freesound en HTTPS', () => {
    expect(isSupportedRemote('https://cdn.freesound.org/previews/1/one.mp3')).toBe(true);
    expect(isSupportedRemote('https://example.com/one.mp3')).toBe(false);
    expect(isSupportedRemote('http://cdn.freesound.org/one.mp3')).toBe(false);
  });
});
