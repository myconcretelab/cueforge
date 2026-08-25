import { describe, expect, it } from 'vitest';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) {
    this.values.delete(key);
    delete (this as unknown as Record<string, unknown>)[key];
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
    Object.defineProperty(this, key, { configurable: true, enumerable: true, value });
  }
}

describe('migration de marque du stockage navigateur', () => {
  it('reprend les anciennes clés sans écraser les valeurs CueForge', async () => {
    const originalStorage = globalThis.localStorage;
    const storage = new MemoryStorage();
    storage.setItem('s1-project', 'legacy-project');
    storage.setItem('s1:detail', 'legacy-detail');
    storage.setItem('cueforge-project', 'current-project');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

    const { migrateLegacyBrowserStorage } = await import('../src/client/lib/brand-migration.js');
    migrateLegacyBrowserStorage(storage);

    expect(storage.getItem('cueforge-project')).toBe('current-project');
    expect(storage.getItem('cueforge:detail')).toBe('legacy-detail');
    expect(storage.getItem('s1-project')).toBeNull();
    expect(storage.getItem('s1:detail')).toBeNull();

    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
  });
});
