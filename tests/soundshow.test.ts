import { describe, expect, it } from 'vitest';
import { parseSoundShowProject } from '../src/server/services/soundshow.js';

const fixture = {
  Name: 'Impro !',
  ReleaseDate: '04.12.2025',
  IsRelativePaths: true,
  Categories: [{
    Id: 'category-one',
    Label: 'Bruitages',
    Color: { r: 1, g: 0.5, b: 0, a: 1 },
    Playables: [{
      $type: 'Sound, Assembly-CSharp',
      Id: 'sound-one',
      Name: 'Tonnerre',
      Path: 'Bruitages/tonnerre.mp3',
      URL: 'https://cdn.freesound.org/previews/1/1.mp3',
      Length: 15.072,
      StartTime: 2.5,
      StopTime: 12,
      Loop: true,
      AlwaysFadeIn: true,
      UseCustomColor: true,
      Color: { r: 0, g: 0.25, b: 1, a: 1 },
      Description: 'Orage',
      Copyright: { Text: 'CC0' },
    }, {
      $type: 'Assets.Scripts.PlaylistPlayable, Assembly-CSharp',
      Name: 'Orage complet',
      Playables: ['sound-one'],
      Loop: false,
    }],
  }],
};

describe('SoundShow parser', () => {
  it('préserve catégories, couleurs et réglages audio', () => {
    const result = parseSoundShowProject(`\uFEFF${JSON.stringify(fixture)}`);
    expect(result.name).toBe('Impro !');
    expect(result.categories[0]).toMatchObject({ sourceId: 'category-one', color: '#ff8000' });
    expect(result.tracks[0]).toMatchObject({
      sourceId: 'sound-one',
      path: 'Bruitages/tonnerre.mp3',
      durationMs: 15072,
      startTimeMs: 2500,
      endTimeMs: 12000,
      loop: true,
      fadeInMs: 400,
      fadeOutMs: 400,
      color: '#0040ff',
      copyrightText: 'CC0',
    });
  });

  it('analyse les playlists et produit un avertissement', () => {
    const result = parseSoundShowProject(JSON.stringify(fixture));
    expect(result.playlists).toEqual([{ name: 'Orage complet', sourceTrackIds: ['sound-one'], loop: false }]);
    expect(result.warnings[0]).toContain('playlist');
  });
});
