import { describe, expect, it } from 'vitest';
import { isSupportedAudioFile, titleFromAudioFilename } from '../src/client/lib/file-import.js';

describe('dépôt de fichiers audio', () => {
  it('accepte les types audio et les extensions prises en charge', () => {
    expect(isSupportedAudioFile({ name: 'ambiance.bin', type: 'audio/mpeg' })).toBe(true);
    expect(isSupportedAudioFile({ name: 'orage.FLAC', type: '' })).toBe(true);
    expect(isSupportedAudioFile({ name: 'notes.txt', type: 'text/plain' })).toBe(false);
  });

  it('utilise le nom du fichier comme titre sans extension audio', () => {
    expect(titleFromAudioFilename('Porte église 01.wav')).toBe('Porte église 01');
  });
});
