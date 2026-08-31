import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { playlistRowsAreValid } from '../src/server/services/playlist-rows.js';

describe('validation des rangées de playlist', () => {
  it('accepte des rangées denses qui respectent la limite', () => {
    expect(playlistRowsAreValid([{ rowIndex: 0 }, { rowIndex: 0 }, { rowIndex: 1 }], 2)).toBe(true);
  });

  it('refuse une rangée trop grande', () => {
    expect(playlistRowsAreValid([{ rowIndex: 0 }, { rowIndex: 0 }, { rowIndex: 0 }], 2)).toBe(false);
  });

  it('refuse un index de rangée manquant', () => {
    expect(playlistRowsAreValid([{ rowIndex: 0 }, { rowIndex: 2 }], 4)).toBe(false);
  });

  it('migre les playlists existantes en conservant un morceau par rangée', () => {
    const migration = readFileSync(new URL('../migrations/0026_damp_otto_octavius.sql', import.meta.url), 'utf8');
    expect(migration).toContain('SET "row_index" = "position"');
  });
});
