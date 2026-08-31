import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { durationSecondsToMs } from '../src/client/lib/audio-file-metadata.js';
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

  it('convertit une durée audio valide et ignore les métadonnées absentes', () => {
    expect(durationSecondsToMs(247.222)).toBe(247_222);
    expect(durationSecondsToMs(0)).toBeUndefined();
    expect(durationSecondsToMs(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it('mesure les fichiers des trois parcours d’import avant leur envoi', () => {
    const app = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    const uploadDialog = readFileSync(new URL('../src/client/components/UploadDialog.tsx', import.meta.url), 'utf8');
    const soundShowDialog = readFileSync(new URL('../src/client/components/SoundShowImportDialog.tsx', import.meta.url), 'utf8');
    expect(app).toContain('await readAudioFileDurationMs(file)');
    expect(uploadDialog).toContain('await readAudioFileDurationMs(file)');
    expect(soundShowDialog).toContain('track.durationMs ?? await readAudioFileDurationMs(file)');
  });
});
