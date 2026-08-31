import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FolderImportDialog } from '../src/client/components/FolderImportDialog.js';
import { durationSecondsToMs } from '../src/client/lib/audio-file-metadata.js';
import { droppedFilesHaveSubfolders, droppedFolderNames, droppedFolderTags, firstFolderName, isSupportedAudioFile, readDroppedAudioFiles, titleFromAudioFilename, type DroppedAudioFile } from '../src/client/lib/file-import.js';

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

  it('déduit le groupe et tous les tags du chemin relatif', () => {
    const item = droppedFile('Forêt/Oiseaux/Chouette.wav', ['Forêt', 'Oiseaux']);
    expect(droppedFilesHaveSubfolders([item])).toBe(true);
    expect(firstFolderName(item)).toBe('Forêt');
    expect(droppedFolderTags(item)).toEqual(['Forêt', 'Oiseaux']);
    expect(droppedFolderNames([item, droppedFile('Forêt/Vent.wav', ['forêt']), droppedFile('Ville/Bus.wav', ['Ville'])])).toEqual(['Forêt', 'Ville']);
  });

  it('lit récursivement un dossier déposé sans utiliser son dossier racine comme groupe', async () => {
    const directFile = fakeFile('Intro.wav');
    const nestedFile = fakeFile('Pluie.mp3', 'audio/mpeg');
    const root = directoryEntry('Spectacle', [
      fileEntry(directFile),
      directoryEntry('Ambiances', [fileEntry(nestedFile)]),
    ]);
    const dataTransfer = {
      items: [{ kind: 'file', webkitGetAsEntry: () => root }],
      files: [],
    } as unknown as DataTransfer;

    const files = await readDroppedAudioFiles(dataTransfer);
    expect(files.map((item) => ({ path: item.relativePath, folders: item.folders }))).toEqual([
      { path: 'Ambiances/Pluie.mp3', folders: ['Ambiances'] },
      { path: 'Intro.wav', folders: [] },
    ]);
  });

  it('propose les trois modes d’organisation avant l’import', () => {
    const markup = renderToStaticMarkup(createElement(FolderImportDialog, {
      files: [droppedFile('Ambiances/Pluie.mp3', ['Ambiances'])],
      destinationName: 'Attente',
      onConfirm: () => undefined,
      onClose: () => undefined,
    }));
    expect(markup).toContain('Une catégorie par dossier');
    expect(markup).toContain('Une sous-catégorie par dossier');
    expect(markup).toContain('Les dossiers comme tags');
    expect(markup).toContain('Attente');
  });
});

function fakeFile(name: string, type = 'audio/wav'): File {
  return { name, type, webkitRelativePath: '' } as File;
}

function droppedFile(relativePath: string, folders: string[]): DroppedAudioFile {
  const name = relativePath.split('/').at(-1)!;
  return { file: fakeFile(name), folders, relativePath };
}

function fileEntry(file: File) {
  return { isFile: true, isDirectory: false, name: file.name, file: (success: (value: File) => void) => success(file) };
}

function directoryEntry(name: string, children: ReturnType<typeof fileEntry>[]) {
  return {
    isFile: false,
    isDirectory: true,
    name,
    file: () => undefined,
    createReader: () => {
      let read = false;
      return { readEntries: (success: (entries: ReturnType<typeof fileEntry>[]) => void) => { success(read ? [] : children); read = true; } };
    },
  };
}
