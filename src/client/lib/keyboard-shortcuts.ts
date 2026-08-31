import type { ProjectKeyboardShortcutKey, ProjectKeyboardShortcuts } from '../types';

const modifierOrder = ['Control', 'Alt', 'Shift', 'Meta'] as const;

export const defaultProjectKeyboardShortcuts: ProjectKeyboardShortcuts = {
  nextCategoryShortcut: 'Tab',
  previousCategoryShortcut: 'Control+Tab',
  startTrackShortcut: 'TrackKey',
  crossfadeTrackShortcut: 'Control+TrackKey',
  loadCategoryShortcut: 'AltGraph',
  secondaryOutputHoldShortcut: 'Shift',
  toggleOutputShortcut: 'CapsLock',
  masterVolumeUpShortcut: 'Plus',
  masterVolumeUpFastShortcut: 'Control+Plus',
  masterVolumeDownShortcut: 'Minus',
  masterVolumeDownFastShortcut: 'Control+Minus',
};

export const projectShortcutDefinitions: Array<{
  key: ProjectKeyboardShortcutKey;
  label: string;
  description: string;
  trackKeys?: boolean;
}> = [
  { key: 'nextCategoryShortcut', label: 'Catégorie suivante', description: 'Passe à la catégorie suivante.' },
  { key: 'previousCategoryShortcut', label: 'Catégorie précédente', description: 'Revient à la catégorie précédente.' },
  { key: 'startTrackShortcut', label: 'Démarrer un morceau', description: 'Utilise la position 1 à 9 visible sur le morceau.', trackKeys: true },
  { key: 'crossfadeTrackShortcut', label: 'Fondu enchaîné', description: 'Lance la position 1 à 9 avec un fondu enchaîné.', trackKeys: true },
  { key: 'loadCategoryShortcut', label: 'Charger la catégorie', description: 'Met en cache tous les morceaux de la catégorie actuelle.' },
  { key: 'secondaryOutputHoldShortcut', label: 'Sortie secondaire maintenue', description: 'En maintenant la touche, les nouveaux départs utilisent la sortie secondaire.' },
  { key: 'toggleOutputShortcut', label: 'Basculer la sortie', description: 'Bascule les prochains départs entre les sorties principale et secondaire.' },
  { key: 'masterVolumeUpShortcut', label: 'Volume maître +', description: 'Augmente le volume maître de 2 %.' },
  { key: 'masterVolumeUpFastShortcut', label: 'Volume maître + rapide', description: 'Augmente le volume maître de 10 %.' },
  { key: 'masterVolumeDownShortcut', label: 'Volume maître −', description: 'Diminue le volume maître de 2 %.' },
  { key: 'masterVolumeDownFastShortcut', label: 'Volume maître − rapide', description: 'Diminue le volume maître de 10 %.' },
];

export function projectShortcut(project: Partial<ProjectKeyboardShortcuts>, key: ProjectKeyboardShortcutKey): string {
  return project[key] || defaultProjectKeyboardShortcuts[key];
}

export function trackIndexFromKeyboardEvent(event: KeyboardEvent): number | undefined {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
  if (match) return Number(match[1]) - 1;
  const value = Number(event.key) - 1;
  return Number.isInteger(value) && value >= 0 && value < 9 ? value : undefined;
}

export function shortcutFromKeyboardEvent(event: KeyboardEvent, ignoredModifiers: string[] = []): string | undefined {
  const altGraph = event.key === 'AltGraph' || event.getModifierState?.('AltGraph');
  if (altGraph && event.key === 'AltGraph') return 'AltGraph';
  const trackIndex = trackIndexFromKeyboardEvent(event);
  const key = trackIndex !== undefined ? 'TrackKey' : normalizedKey(event);
  if (!key) return undefined;
  const modifiers = altGraph ? [] : modifierOrder.filter((modifier) => {
    if (modifier === key || ignoredModifiers.includes(modifier)) return false;
    if (modifier === 'Control') return event.ctrlKey;
    if (modifier === 'Alt') return event.altKey;
    if (modifier === 'Shift') return event.shiftKey && key !== 'Plus';
    return event.metaKey;
  });
  return [...modifiers, key].join('+');
}

export function shortcutModifierKeys(shortcut: string): string[] {
  return shortcut.split('+').filter((part) => modifierOrder.includes(part as typeof modifierOrder[number]));
}

export function shortcutMainKey(shortcut: string): string {
  return shortcut.split('+').at(-1) ?? shortcut;
}

export function formatShortcut(shortcut: string): string {
  const labels: Record<string, string> = {
    Control: 'Ctrl', Meta: 'Cmd', Alt: 'Alt', Shift: 'Maj', AltGraph: 'AltGr',
    TrackKey: 'Touches 1–9', Tab: 'Tab', CapsLock: 'Verr. Maj', Plus: '+', Minus: '−',
    Escape: 'Échap', Backspace: 'Retour arrière', Space: 'Espace', ArrowLeft: '←',
    ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Enter: 'Entrée',
  };
  return shortcut.split('+').map((part) => labels[part] ?? (/^Key[A-Z]$/.test(part) ? part.slice(3) : part)).join(' + ');
}

function normalizedKey(event: KeyboardEvent): string | undefined {
  if (event.key === '+') return 'Plus';
  if (event.key === '-') return 'Minus';
  if (event.key === ' ') return 'Space';
  if (['Control', 'Alt', 'Shift', 'Meta', 'Tab', 'CapsLock', 'Escape', 'Backspace', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return event.key;
  if (/^F(?:[1-9]|1[0-2])$/.test(event.key)) return event.key;
  if (/^Key[A-Z]$/.test(event.code)) return event.code;
  if (/^[A-Za-z][A-Za-z0-9]*$/.test(event.code)) return event.code;
  return undefined;
}
