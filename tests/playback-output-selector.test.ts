import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PlaybackOutputSelector } from '../src/client/components/PlaybackOutputSelector.js';
import { TrackPad } from '../src/client/components/TrackPad.js';
import type { RoutedBridgeOutput } from '../src/client/lib/bridge-output-routing.js';
import type { Track } from '../src/client/types.js';

const outputs: RoutedBridgeOutput[] = [
  { id: 'speakers', name: 'Haut-parleurs', isDefault: true, color: '#22c55e' },
  { id: 'usb', name: 'Jean Luc', isDefault: false, color: '#3b82f6' },
];

describe('sélecteur de sortie d’une lecture', () => {
  it('affiche une LED cliquable et toutes les sorties', () => {
    const markup = renderToStaticMarkup(createElement(PlaybackOutputSelector, { title: 'Ouverture', outputId: 'usb', outputs, disabled: false, onChange: () => undefined }));
    expect(markup).toContain('player-output-selector');
    expect(markup).toContain('--output-color:#3b82f6');
    expect(markup).toContain('aria-label="Sortie de lecture de Ouverture"');
    expect(markup).toContain('Jean Luc');
  });

  it('reste masqué lorsqu’une seule sortie est disponible', () => {
    expect(renderToStaticMarkup(createElement(PlaybackOutputSelector, { title: 'Ouverture', outputId: 'speakers', outputs: outputs.slice(0, 1), disabled: false, onChange: () => undefined }))).toBe('');
  });

  it('ajoute un petit Play par sortie au morceau', () => {
    const track = { id: 'track-1', title: 'Ouverture', durationMs: 60_000, startTimeMs: 0, endTimeMs: null, volume: 1, loop: false } as Track;
    const ignore = () => undefined;
    const markup = renderToStaticMarkup(createElement(TrackPad, { track, color: '#f97316', active: false, playbacks: [], historyProgress: 0, loaded: false, reorderEnabled: false, playlistDropEnabled: false, dropTarget: false, bridgeOutputs: outputs, onPrimary: ignore, onOutputPlay: ignore, onSecondary: ignore, onEdit: ignore, onDragStart: ignore, onDragOver: ignore, onDrop: ignore, onDragEnd: ignore }));
    expect(markup).toContain('aria-label="Jouer Ouverture sur Haut-parleurs"');
    expect(markup).toContain('aria-label="Jouer Ouverture sur Jean Luc"');
  });
});
