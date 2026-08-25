const legacyPrefixes = ['s1-', 's1:'] as const;

export function migrateLegacyBrowserStorage(storage: Storage): void {
  for (const key of Object.keys(storage)) {
    const legacyPrefix = legacyPrefixes.find((prefix) => key.startsWith(prefix));
    if (!legacyPrefix) continue;

    const cueForgeKey = `${legacyPrefix === 's1-' ? 'cueforge-' : 'cueforge:'}${key.slice(legacyPrefix.length)}`;
    if (storage.getItem(cueForgeKey) === null) {
      const value = storage.getItem(key);
      if (value !== null) storage.setItem(cueForgeKey, value);
    }
    storage.removeItem(key);
  }
}

migrateLegacyBrowserStorage(localStorage);
