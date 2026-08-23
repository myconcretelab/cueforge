const audioExtensions = /\.(?:mp3|wav|ogg|flac|m4a|aac)$/i;
const audioMimeTypes = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave', 'audio/ogg', 'audio/flac',
  'audio/x-flac', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/x-aac', 'application/ogg',
]);

export function isSupportedAudioFile(file: Pick<File, 'name' | 'type'>): boolean {
  return audioMimeTypes.has(file.type) || audioExtensions.test(file.name);
}

export function titleFromAudioFilename(filename: string): string {
  return filename.replace(audioExtensions, '');
}
