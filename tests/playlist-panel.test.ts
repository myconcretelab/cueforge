import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('éditeur visuel de playlist', () => {
  const panel = readFileSync(new URL('../src/client/components/PlaylistPanel.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../src/client/styles.css', import.meta.url), 'utf8');

  it('partage toute la largeur entre les morceaux sans défilement horizontal', () => {
    expect(panel).toContain("'--playlist-row-item-count': row.items.length");
    expect(styles).toContain('grid-template-columns: repeat(var(--playlist-row-item-count), minmax(0, 1fr));');
    expect(styles).toContain('.playlist-row-items { --playlist-row-item-count: 1; min-width: 0; display: grid;');
    expect(styles).not.toContain('.playlist-row-items { min-width: 0; display: flex;');
  });

  it('affiche le titre complet seulement lorsque son libellé est tronqué', () => {
    expect(panel).toContain('titleElement.scrollWidth <= titleElement.clientWidth');
    expect(panel).toContain('className="playlist-title-popover"');
    expect(panel).toContain('Titre du morceau');
  });

  it('révèle uniquement la bande survolée pendant un glisser-déposer', () => {
    expect(panel).toContain("playlistDragActive ? 'is-dragging' : ''");
    expect(panel).toContain('setPlaylistDragActive(true)');
    expect(panel).toContain('event.dataTransfer.setData(playlistItemMime, item.id)');
    expect(styles).toContain('.playlist-dropzone.is-dragging .playlist-row-insert:hover { height: 22px;');
    expect(styles).not.toContain('.playlist-row-insert:hover, .playlist-row-insert:focus-within');
    expect(styles).not.toContain('.playlist-dropzone.is-dragging .playlist-row-insert { height: 22px;');
  });

  it('propose et affiche le grand bouton suivant sur toute la largeur', () => {
    const app = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    const routes = readFileSync(new URL('../src/server/routes/projects.ts', import.meta.url), 'utf8');
    const migration = readFileSync(new URL('../migrations/0029_secret_fantastic_four.sql', import.meta.url), 'utf8');
    expect(panel).toContain('checked={options.showNextButton}');
    expect(panel).toContain('className="playlist-next-large" onClick={onNext}');
    expect(styles).toContain('.playlist-next-large { width: 100%; min-height: 58px;');
    expect(app).toContain('showNextButton: playlist.showNextButton ?? false');
    expect(routes).toContain('showNextButton: input.showNextButton');
    expect(migration).toContain('"show_next_button" boolean DEFAULT false NOT NULL');
  });

  it('ne conserve pas la légende explicative au-dessus des rangées', () => {
    expect(panel).not.toContain('playlist-drop-guide');
    expect(panel).not.toContain('Sur une rangée : jouer ensemble');
  });
});
