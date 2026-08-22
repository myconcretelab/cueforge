import { z } from 'zod';

const colorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
}).passthrough();

const soundSchema = z.object({
  $type: z.string(),
  Id: z.string().optional(),
  Name: z.string().nullish(),
  DefaultName: z.string().nullish(),
  Path: z.string().nullish(),
  URL: z.string().url().nullish(),
  Length: z.number().nonnegative().nullish(),
  ActualDuration: z.number().nonnegative().nullish(),
  StartTime: z.number().nonnegative().nullish(),
  StopTime: z.number().nonnegative().nullish(),
  Loop: z.boolean().nullish(),
  AlwaysFadeIn: z.boolean().nullish(),
  Color: colorSchema.nullish(),
  UseCustomColor: z.boolean().nullish(),
  Description: z.string().nullish(),
  Copyright: z.object({ Text: z.string().nullish() }).passthrough().nullish(),
}).passthrough();

const playlistSchema = z.object({
  $type: z.string(),
  Name: z.string().nullish(),
  Playables: z.array(z.string()).default([]),
  Loop: z.boolean().nullish(),
}).passthrough();

const categorySchema = z.object({
  Id: z.string().optional(),
  Label: z.string().min(1),
  Color: colorSchema.nullish(),
  Playables: z.array(z.unknown()).default([]),
}).passthrough();

const projectSchema = z.object({
  Name: z.string().min(1),
  ReleaseDate: z.string().nullish(),
  IsRelativePaths: z.boolean().nullish(),
  Categories: z.array(categorySchema),
}).passthrough();

export interface SoundShowTrack {
  sourceId: string;
  categorySourceId: string;
  title: string;
  path: string | null;
  url: string | null;
  durationMs: number | null;
  startTimeMs: number;
  endTimeMs: number | null;
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
  color: string | null;
  description: string | null;
  copyrightText: string | null;
  position: number;
}

export interface SoundShowAnalysis {
  name: string;
  releaseDate: string | null;
  relativePaths: boolean;
  categories: Array<{ sourceId: string; name: string; color: string; position: number }>;
  tracks: SoundShowTrack[];
  playlists: Array<{ name: string; sourceTrackIds: string[]; loop: boolean }>;
  warnings: string[];
}

export function parseSoundShowProject(contents: string | Buffer): SoundShowAnalysis {
  const text = Buffer.isBuffer(contents) ? contents.toString('utf8') : contents;
  const raw = projectSchema.parse(JSON.parse(text.replace(/^\uFEFF/, '')));
  const tracks: SoundShowTrack[] = [];
  const playlists: SoundShowAnalysis['playlists'] = [];
  const warnings: string[] = [];

  const categories = raw.Categories.map((category, categoryIndex) => {
    const categorySourceId = category.Id ?? `category-${categoryIndex}`;
    category.Playables.forEach((playable, position) => {
      if (!playable || typeof playable !== 'object' || !('$type' in playable)) return;
      const type = String((playable as { $type: unknown }).$type);
      if (type.includes('PlaylistPlayable')) {
        const playlist = playlistSchema.parse(playable);
        playlists.push({
          name: cleanText(playlist.Name) ?? `Playlist ${playlists.length + 1}`,
          sourceTrackIds: playlist.Playables,
          loop: playlist.Loop ?? false,
        });
        return;
      }
      if (!type.startsWith('Sound')) {
        warnings.push(`Type SoundShow non pris en charge : ${type}`);
        return;
      }
      const sound = soundSchema.parse(playable);
      const path = cleanText(sound.Path);
      const url = cleanText(sound.URL);
      const title = cleanText(sound.Name) ?? cleanText(sound.DefaultName) ?? filenameStem(path) ?? `Son ${tracks.length + 1}`;
      const durationSeconds = sound.ActualDuration || sound.Length || null;
      const startSeconds = sound.StartTime ?? 0;
      const stopSeconds = sound.StopTime && sound.StopTime > startSeconds ? sound.StopTime : null;
      tracks.push({
        sourceId: sound.Id ?? `track-${categoryIndex}-${position}`,
        categorySourceId,
        title: title.slice(0, 160),
        path,
        url,
        durationMs: durationSeconds ? Math.round(durationSeconds * 1000) : null,
        startTimeMs: Math.round(startSeconds * 1000),
        endTimeMs: stopSeconds ? Math.round(stopSeconds * 1000) : null,
        loop: sound.Loop ?? false,
        fadeInMs: sound.AlwaysFadeIn ? 400 : 0,
        fadeOutMs: 400,
        color: sound.UseCustomColor && sound.Color ? colorToHex(sound.Color) : null,
        description: cleanText(sound.Description),
        copyrightText: cleanText(sound.Copyright?.Text),
        position,
      });
    });
    return {
      sourceId: categorySourceId,
      name: category.Label.slice(0, 80),
      color: category.Color ? colorToHex(category.Color) : '#8b5cf6',
      position: categoryIndex,
    };
  });

  if (playlists.length) warnings.push(`${playlists.length} playlist(s) détectée(s) : leur contenu est analysé mais pas encore importé.`);
  return {
    name: raw.Name.slice(0, 120),
    releaseDate: cleanText(raw.ReleaseDate),
    relativePaths: raw.IsRelativePaths ?? false,
    categories,
    tracks,
    playlists,
    warnings: [...new Set(warnings)],
  };
}

function colorToHex(color: z.infer<typeof colorSchema>): string {
  const channel = (value: number) => Math.round(value * 255).toString(16).padStart(2, '0');
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

function cleanText(value: string | null | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function filenameStem(filePath: string | null): string | null {
  if (!filePath) return null;
  const filename = filePath.replaceAll('\\', '/').split('/').pop();
  return filename?.replace(/\.[^.]+$/, '') || null;
}
