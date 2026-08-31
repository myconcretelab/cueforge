import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('réglages de la colonne de lecture', () => {
  it('migre les valeurs par défaut à huit lectures et cinq cartes', () => {
    const migration = readFileSync(new URL('../migrations/0028_lame_vengeance.sql', import.meta.url), 'utf8');
    expect(migration).toContain('"max_active_playbacks" integer DEFAULT 8 NOT NULL');
    expect(migration).toContain('"compact_playback_threshold" integer DEFAULT 5 NOT NULL');
  });

  it('valide les deux réglages entre un et seize', () => {
    const route = readFileSync(new URL('../src/server/routes/projects.ts', import.meta.url), 'utf8');
    expect(route).toContain('maxActivePlaybacks: z.number().int().min(1).max(16).optional()');
    expect(route).toContain('compactPlaybackThreshold: z.number().int().min(1).max(16).optional()');
  });
});
