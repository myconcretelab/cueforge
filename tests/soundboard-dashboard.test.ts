import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tableau de bord du soundboard', () => {
  it('reste sans cadre et réduit son occupation verticale', () => {
    const styles = readFileSync(new URL('../src/client/styles.css', import.meta.url), 'utf8');
    expect(styles).toContain('.workspace-soundboard .dashboard { margin: 4px 10px; padding: 0; }');
    expect(styles).toContain('gap: 10px; border: 0; background: transparent;');
    expect(styles).toContain("html[data-skin='studio'] .dashboard { border: 0; border-radius: 0; background: transparent;");
  });
});
