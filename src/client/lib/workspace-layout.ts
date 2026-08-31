export const workspaceLayoutRows = 12;
export const workspaceLayoutColumns = [6, 8, 12] as const;

export type WorkspaceGridColumns = typeof workspaceLayoutColumns[number];
export type WorkspaceBlockId = 'categories' | 'soundboard' | 'players' | 'playlist';
export type WorkspacePreset = 'classic' | 'playlist-vertical' | 'playlist-focus' | 'custom';

export interface WorkspaceLayoutItem {
  id: WorkspaceBlockId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorkspaceLayout {
  columns: WorkspaceGridColumns;
  preset: WorkspacePreset;
  items: WorkspaceLayoutItem[];
}

export const workspaceBlockLabels: Record<WorkspaceBlockId, string> = {
  categories: 'Catégories',
  soundboard: 'Soundboard',
  players: 'Lectures en cours',
  playlist: 'Playlist',
};

export const workspacePresetLabels: Record<Exclude<WorkspacePreset, 'custom'>, string> = {
  classic: 'Régie classique',
  'playlist-vertical': 'Playlist verticale',
  'playlist-focus': 'Playlist principale',
};

const basePresets: Record<Exclude<WorkspacePreset, 'custom'>, WorkspaceLayoutItem[]> = {
  classic: [
    { id: 'categories', x: 0, y: 0, w: 9, h: 2 },
    { id: 'soundboard', x: 0, y: 2, w: 9, h: 10 },
    { id: 'players', x: 9, y: 0, w: 3, h: 6 },
    { id: 'playlist', x: 9, y: 6, w: 3, h: 6 },
  ],
  'playlist-vertical': [
    { id: 'playlist', x: 0, y: 0, w: 4, h: 12 },
    { id: 'categories', x: 4, y: 0, w: 8, h: 2 },
    { id: 'soundboard', x: 4, y: 2, w: 6, h: 10 },
    { id: 'players', x: 10, y: 2, w: 2, h: 10 },
  ],
  'playlist-focus': [
    { id: 'categories', x: 0, y: 0, w: 12, h: 2 },
    { id: 'playlist', x: 0, y: 2, w: 8, h: 10 },
    { id: 'players', x: 8, y: 2, w: 4, h: 4 },
    { id: 'soundboard', x: 8, y: 6, w: 4, h: 6 },
  ],
};

const minimumSizes: Record<WorkspaceBlockId, { w: number; h: number }> = {
  categories: { w: 2, h: 2 },
  soundboard: { w: 2, h: 4 },
  players: { w: 1, h: 3 },
  playlist: { w: 2, h: 4 },
};

export function createWorkspaceLayout(preset: Exclude<WorkspacePreset, 'custom'> = 'classic', columns: WorkspaceGridColumns = 12): WorkspaceLayout {
  return { columns, preset, items: scaleItems(basePresets[preset], 12, columns) };
}

export function workspaceLayoutWithColumns(layout: WorkspaceLayout, columns: WorkspaceGridColumns): WorkspaceLayout {
  if (layout.columns === columns) return layout;
  return { columns, preset: layout.preset, items: scaleItems(layout.items, layout.columns, columns) };
}

export function workspaceLayoutItem(layout: WorkspaceLayout, id: WorkspaceBlockId): WorkspaceLayoutItem {
  return layout.items.find((item) => item.id === id) ?? createWorkspaceLayout('classic', layout.columns).items.find((item) => item.id === id)!;
}

export function moveWorkspaceItem(layout: WorkspaceLayout, id: WorkspaceBlockId, x: number, y: number): WorkspaceLayout {
  const current = workspaceLayoutItem(layout, id);
  return replaceWorkspaceItem(layout, { ...current, x: clamp(x, 0, layout.columns - current.w), y: clamp(y, 0, workspaceLayoutRows - current.h) });
}

export function resizeWorkspaceItem(layout: WorkspaceLayout, id: WorkspaceBlockId, w: number, h: number): WorkspaceLayout {
  const current = workspaceLayoutItem(layout, id);
  const minimum = minimumSizes[id];
  return replaceWorkspaceItem(layout, {
    ...current,
    w: clamp(w, Math.min(minimum.w, layout.columns), layout.columns - current.x),
    h: clamp(h, minimum.h, workspaceLayoutRows - current.y),
  });
}

export function swapWorkspaceItems(layout: WorkspaceLayout, firstId: WorkspaceBlockId, secondId: WorkspaceBlockId): WorkspaceLayout {
  if (firstId === secondId) return layout;
  const first = workspaceLayoutItem(layout, firstId);
  const second = workspaceLayoutItem(layout, secondId);
  return {
    ...layout,
    preset: 'custom',
    items: layout.items.map((item) => item.id === firstId ? { ...second, id: firstId } : item.id === secondId ? { ...first, id: secondId } : item),
  };
}

export function readWorkspaceLayout(serialized: string | null): WorkspaceLayout {
  if (!serialized) return createWorkspaceLayout();
  try {
    const value = JSON.parse(serialized) as WorkspaceLayout;
    if (!workspaceLayoutColumns.includes(value.columns) || !Array.isArray(value.items) || !layoutItemsAreValid(value.items, value.columns)) return createWorkspaceLayout();
    return { columns: value.columns, preset: value.preset in workspacePresetLabels || value.preset === 'custom' ? value.preset : 'custom', items: value.items };
  } catch {
    return createWorkspaceLayout();
  }
}

export function workspaceLayoutStorageKey(userId: string): string {
  return `sonoriva-workspace-layout:${userId}`;
}

function replaceWorkspaceItem(layout: WorkspaceLayout, nextItem: WorkspaceLayoutItem): WorkspaceLayout {
  if (layout.items.some((item) => item.id !== nextItem.id && itemsOverlap(item, nextItem))) return layout;
  return { ...layout, preset: 'custom', items: layout.items.map((item) => item.id === nextItem.id ? nextItem : item) };
}

function scaleItems(items: WorkspaceLayoutItem[], fromColumns: number, toColumns: WorkspaceGridColumns): WorkspaceLayoutItem[] {
  return items.map((item) => {
    const x = Math.round(item.x / fromColumns * toColumns);
    const right = Math.round((item.x + item.w) / fromColumns * toColumns);
    return { ...item, x, w: Math.max(1, right - x) };
  });
}

function layoutItemsAreValid(items: WorkspaceLayoutItem[], columns: WorkspaceGridColumns): boolean {
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== 4 || !(['categories', 'soundboard', 'players', 'playlist'] as WorkspaceBlockId[]).every((id) => ids.has(id))) return false;
  return items.every((item) => Number.isInteger(item.x) && Number.isInteger(item.y) && Number.isInteger(item.w) && Number.isInteger(item.h)
    && item.x >= 0 && item.y >= 0 && item.w > 0 && item.h > 0 && item.x + item.w <= columns && item.y + item.h <= workspaceLayoutRows)
    && items.every((item, index) => items.slice(index + 1).every((other) => !itemsOverlap(item, other)));
}

function itemsOverlap(first: WorkspaceLayoutItem, second: WorkspaceLayoutItem): boolean {
  return first.x < second.x + second.w && first.x + first.w > second.x && first.y < second.y + second.h && first.y + first.h > second.y;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
