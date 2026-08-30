import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('commandes de lecture et préférences de session', () => {
  const source = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');

  it('laisse les raccourcis globaux actifs pendant le réglage d’un curseur', () => {
    expect(source).toContain("event.target.type !== 'range'");
    expect(source).toContain('onPointerUp={(event) => event.currentTarget.blur()}');
  });

  it('conserve le nombre de colonnes lors de la déconnexion', () => {
    expect(source).toContain("!key.startsWith('sonoriva-track-columns')");
    expect(source).toContain('trackColumnsStorageKey(detail.project.id, columnCategoryId');
  });

  it('permet de quitter la démonstration pour rejoindre la connexion', () => {
    expect(source).toContain('async function leaveDemoForLogin()');
    expect(source).toContain("window.history.replaceState({}, '', '/')");
    expect(source).toContain('Se connecter à mon compte');
  });
});
