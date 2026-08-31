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

  it('révèle toutes les bandes d’insertion pendant les glisser-déposer externes et internes', () => {
    expect(panel).toContain("playlistDragActive ? 'is-dragging' : ''");
    expect(panel).toContain('setPlaylistDragActive(true)');
    expect(panel).toContain('event.dataTransfer.setData(playlistItemMime, item.id)');
    expect(styles).toContain('.playlist-dropzone.is-dragging .playlist-row-insert { height: 22px;');
  });

  it('ne conserve pas la légende explicative au-dessus des rangées', () => {
    expect(panel).not.toContain('playlist-drop-guide');
    expect(panel).not.toContain('Sur une rangée : jouer ensemble');
  });
});
