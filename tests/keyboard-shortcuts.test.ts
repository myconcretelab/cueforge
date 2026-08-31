import { describe, expect, it } from 'vitest';
import {
  formatShortcut,
  projectShortcut,
  shortcutFromKeyboardEvent,
  trackIndexFromKeyboardEvent,
} from '../src/client/lib/keyboard-shortcuts';

function keyboardEvent(input: Partial<KeyboardEvent> & Pick<KeyboardEvent, 'key' | 'code'>): KeyboardEvent {
  return {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    getModifierState: () => false,
    ...input,
  } as KeyboardEvent;
}

describe('raccourcis clavier', () => {
  it('applique les affectations par défaut lorsqu’un spectacle ancien ne les fournit pas', () => {
    expect(projectShortcut({}, 'nextCategoryShortcut')).toBe('Tab');
    expect(projectShortcut({}, 'crossfadeTrackShortcut')).toBe('Control+TrackKey');
    expect(projectShortcut({}, 'secondaryOutputHoldShortcut')).toBe('Shift');
  });

  it('reconnaît les positions 1 à 9 indépendamment du caractère produit par le clavier', () => {
    const event = keyboardEvent({ key: '&', code: 'Digit1' });
    expect(trackIndexFromKeyboardEvent(event)).toBe(0);
    expect(shortcutFromKeyboardEvent(event)).toBe('TrackKey');
  });

  it('peut ignorer Maj maintenue pour envoyer un départ vers la sortie secondaire', () => {
    const event = keyboardEvent({ key: '1', code: 'Digit1', shiftKey: true });
    expect(shortcutFromKeyboardEvent(event)).toBe('Shift+TrackKey');
    expect(shortcutFromKeyboardEvent(event, ['Shift'])).toBe('TrackKey');
  });

  it('normalise le plus principal ou numérique sans imposer Maj', () => {
    expect(shortcutFromKeyboardEvent(keyboardEvent({ key: '+', code: 'Equal', shiftKey: true }))).toBe('Plus');
    expect(shortcutFromKeyboardEvent(keyboardEvent({ key: '+', code: 'NumpadAdd', ctrlKey: true }))).toBe('Control+Plus');
  });

  it('affiche les combinaisons avec des libellés français', () => {
    expect(formatShortcut('Control+TrackKey')).toBe('Ctrl + Touches 1–9');
    expect(formatShortcut('AltGraph')).toBe('AltGr');
  });
});
