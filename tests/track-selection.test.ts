import { describe, expect, it } from 'vitest';
import { intersectsSelection } from '../src/client/lib/track-selection.js';

describe('rectangle de sélection des morceaux', () => {
  const card = { left: 100, right: 200, top: 100, bottom: 200 };

  it('sélectionne une carte touchée par le rectangle dans les deux sens de tracé', () => {
    expect(intersectsSelection(card, { startX: 50, startY: 50, currentX: 150, currentY: 150 })).toBe(true);
    expect(intersectsSelection(card, { startX: 250, startY: 250, currentX: 150, currentY: 150 })).toBe(true);
  });

  it('ignore une carte extérieure au rectangle', () => {
    expect(intersectsSelection(card, { startX: 210, startY: 210, currentX: 300, currentY: 300 })).toBe(false);
  });
});
