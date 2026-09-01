export const workspaceLayoutRows = 12;
export const workspaceLayoutColumns = [6, 8, 12] as const;
export const compactPlaylistMinimumRows = 4;
export const compactPlaylistMaximumRows = 9;

export type WorkspaceGridColumns = typeof workspaceLayoutColumns[number];
export type WorkspaceBlockId = 'actions' | 'categories' | 'soundboard' | 'players' | 'playlist';
export type WorkspacePreset = 'classic' | 'compact-control' | 'playlist-vertical' | 'playlist-focus' | 'custom';
export const workspaceDockableBlockIds: WorkspaceBlockId[] = ['actions', 'players', 'playlist'];
export const workspaceCollapsibleBlockIds: WorkspaceBlockId[] = ['actions', 'playlist'];

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
  dock: WorkspaceBlockId[];
  collapsed: WorkspaceBlockId[];
  compactPlaylistEnabled: boolean;
  compactPlaylistOpen: boolean;
  compactPlaylistRows: number;
}

export const workspaceBlockLabels: Record<WorkspaceBlockId, string> = {
  actions: 'Actions de déclenchement',
  categories: 'Catégories',
  soundboard: 'Soundboard',
  players: 'Lectures en cours',
  playlist: 'Playlist',
};

export const workspacePresetLabels: Record<Exclude<WorkspacePreset, 'custom'>, string> = {
  classic: 'Régie classique',
  'compact-control': 'Régie compacte',
  'playlist-vertical': 'Playlist verticale',
  'playlist-focus': 'Playlist principale',
};

const basePresets: Record<Exclude<WorkspacePreset, 'custom'>, WorkspaceLayoutItem[]> = {
  classic: [
    { id: 'actions', x: 0, y: 0, w: 3, h: 4 },
    { id: 'categories', x: 0, y: 0, w: 9, h: 3 },
    { id: 'soundboard', x: 0, y: 3, w: 9, h: 9 },
    { id: 'players', x: 9, y: 0, w: 3, h: 6 },
    { id: 'playlist', x: 9, y: 6, w: 3, h: 6 },
  ],
  'compact-control': [
    { id: 'actions', x: 0, y: 0, w: 3, h: 4 },
    { id: 'categories', x: 0, y: 0, w: 9, h: 3 },
    { id: 'soundboard', x: 0, y: 3, w: 9, h: 9 },
    { id: 'players', x: 9, y: 0, w: 3, h: 8 },
    { id: 'playlist', x: 9, y: 8, w: 3, h: 4 },
  ],
  'playlist-vertical': [
    { id: 'actions', x: 0, y: 0, w: 3, h: 4 },
    { id: 'playlist', x: 0, y: 0, w: 4, h: 12 },
    { id: 'categories', x: 4, y: 0, w: 8, h: 3 },
    { id: 'soundboard', x: 4, y: 3, w: 6, h: 9 },
    { id: 'players', x: 10, y: 3, w: 2, h: 9 },
  ],
  'playlist-focus': [
    { id: 'actions', x: 0, y: 0, w: 3, h: 4 },
    { id: 'categories', x: 0, y: 0, w: 12, h: 3 },
    { id: 'playlist', x: 0, y: 3, w: 8, h: 9 },
    { id: 'players', x: 8, y: 3, w: 4, h: 4 },
    { id: 'soundboard', x: 8, y: 7, w: 4, h: 5 },
  ],
};

const minimumSizes: Record<WorkspaceBlockId, { w: number; h: number }> = {
  actions: { w: 2, h: 3 },
  categories: { w: 2, h: 3 },
  soundboard: { w: 2, h: 4 },
  players: { w: 1, h: 3 },
  playlist: { w: 2, h: 4 },
};

export function createWorkspaceLayout(preset: Exclude<WorkspacePreset, 'custom'> = 'classic', columns: WorkspaceGridColumns = 12): WorkspaceLayout {
  return { columns, preset, items: scaleItems(basePresets[preset], 12, columns), dock: ['actions'], collapsed: preset === 'compact-control' ? ['playlist'] : [], compactPlaylistEnabled: preset === 'compact-control', compactPlaylistOpen: false, compactPlaylistRows: 6 };
}

export function workspaceLayoutWithColumns(layout: WorkspaceLayout, columns: WorkspaceGridColumns): WorkspaceLayout {
  if (layout.columns === columns) return layout;
  return { ...layout, columns, items: scaleItems(layout.items, layout.columns, columns) };
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
  const firstDocked = workspaceItemIsDocked(layout, firstId);
  const secondDocked = workspaceItemIsDocked(layout, secondId);
  if (firstDocked && secondDocked) {
    const dock = workspaceDockItems(layout);
    const firstIndex = dock.indexOf(firstId);
    const secondIndex = dock.indexOf(secondId);
    [dock[firstIndex], dock[secondIndex]] = [dock[secondIndex]!, dock[firstIndex]!];
    return { ...layout, preset: 'custom', dock };
  }
  const compactPairSwap = layout.compactPlaylistEnabled && ((firstId === 'actions' && (secondId === 'players' || secondId === 'playlist')) || (secondId === 'actions' && (firstId === 'players' || firstId === 'playlist')));
  const actionWasDocked = firstId === 'actions' ? firstDocked : secondId === 'actions' ? secondDocked : false;
  const dock: WorkspaceBlockId[] = compactPairSwap
    ? [...workspaceDockItems(layout).filter((id) => id !== 'actions' && id !== 'players' && id !== 'playlist'), actionWasDocked ? 'players' : 'actions']
    : firstDocked === secondDocked
    ? layout.dock
    : workspaceDockItems(layout).map((id) => id === (firstDocked ? firstId : secondId) ? (firstDocked ? secondId : firstId) : id);
  let items = layout.items.map((item) => item.id === firstId ? { ...second, id: firstId } : item.id === secondId ? { ...first, id: secondId } : item);
  if (compactPairSwap) {
    const actionDocked = dock.includes('actions');
    const gridSlot = actionDocked ? (firstId === 'actions' ? first : second) : (firstId === 'actions' ? second : first);
    const playlistRows = clamp(layout.compactPlaylistRows, compactPlaylistMinimumRows, compactPlaylistMaximumRows);
    items = items.map((item) => {
      if (!actionDocked && item.id === 'actions') return { ...item, x: gridSlot.x, y: 0, w: gridSlot.w, h: workspaceLayoutRows };
      if (actionDocked && item.id === 'players') return { ...item, x: gridSlot.x, y: 0, w: gridSlot.w, h: workspaceLayoutRows - playlistRows };
      if (actionDocked && item.id === 'playlist') return { ...item, x: gridSlot.x, y: workspaceLayoutRows - playlistRows, w: gridSlot.w, h: playlistRows };
      return item;
    });
  }
  return {
    ...layout,
    preset: 'custom',
    dock,
    items,
  };
}

export function workspaceItemIsDocked(layout: WorkspaceLayout, id: WorkspaceBlockId): boolean {
  if (layout.dock.includes(id)) return true;
  return layout.compactPlaylistEnabled && (id === 'players' || id === 'playlist') && layout.dock.some((item) => item === 'players' || item === 'playlist');
}

export function workspaceItemIsCollapsed(layout: WorkspaceLayout, id: WorkspaceBlockId): boolean {
  return layout.collapsed.includes(id);
}

export function setWorkspaceItemCollapsed(layout: WorkspaceLayout, id: WorkspaceBlockId, collapsed: boolean): WorkspaceLayout {
  if (!workspaceCollapsibleBlockIds.includes(id)) return layout;
  const nextCollapsed = collapsed
    ? [...layout.collapsed.filter((item) => item !== id), id]
    : layout.collapsed.filter((item) => item !== id);
  if (nextCollapsed.length === layout.collapsed.length && nextCollapsed.every((item, index) => item === layout.collapsed[index])) return layout;
  return {
    ...layout,
    collapsed: nextCollapsed,
    ...(id === 'playlist' && layout.compactPlaylistEnabled ? { compactPlaylistOpen: !collapsed } : {}),
  };
}

export function workspaceDockItems(layout: WorkspaceLayout): WorkspaceBlockId[] {
  const dock = layout.dock.filter((id, index) => layout.dock.indexOf(id) === index);
  if (!layout.compactPlaylistEnabled || !dock.some((id) => id === 'players' || id === 'playlist')) return dock;
  const firstPairIndex = dock.findIndex((id) => id === 'players' || id === 'playlist');
  const withoutPair: WorkspaceBlockId[] = dock.filter((id) => id !== 'players' && id !== 'playlist');
  withoutPair.splice(firstPairIndex, 0, 'players', 'playlist');
  return withoutPair;
}

export function dockWorkspaceItem(layout: WorkspaceLayout, id: WorkspaceBlockId): WorkspaceLayout {
  if (!workspaceDockableBlockIds.includes(id)) return layout;
  const ids = layout.compactPlaylistEnabled && (id === 'players' || id === 'playlist') ? ['players', 'playlist'] as WorkspaceBlockId[] : [id];
  const dock = [...layout.dock.filter((item) => !ids.includes(item)), ...ids];
  const next = { ...layout, preset: 'custom' as const, dock };
  const gridItems = next.items.filter((item) => !workspaceItemIsDocked(next, item.id));
  const rightEdge = Math.max(...gridItems.map((item) => item.x + item.w));
  if (rightEdge >= next.columns) return next;
  return { ...next, items: next.items.map((item) => !workspaceItemIsDocked(next, item.id) && item.x + item.w === rightEdge ? { ...item, w: next.columns - item.x } : item) };
}

export function placeWorkspaceItemOnGrid(layout: WorkspaceLayout, id: WorkspaceBlockId, x: number, y: number): WorkspaceLayout {
  const ids = layout.compactPlaylistEnabled && (id === 'players' || id === 'playlist') ? ['players', 'playlist'] as WorkspaceBlockId[] : [id];
  const undocked = { ...layout, dock: layout.dock.filter((item) => !ids.includes(item)) };
  const moved = moveWorkspaceItem(undocked, id, x, y);
  return moved === undocked ? layout : moved;
}

export function readWorkspaceLayout(serialized: string | null): WorkspaceLayout {
  if (!serialized) return createWorkspaceLayout();
  try {
    const value = JSON.parse(serialized) as WorkspaceLayout;
    const storedItems = Array.isArray(value.items) && !value.items.some((item) => item.id === 'actions')
      ? [...value.items, createWorkspaceLayout('classic', value.columns).items.find((item) => item.id === 'actions')!]
      : value.items;
    const dock = Array.isArray(value.dock) ? value.dock.filter((id): id is WorkspaceBlockId => workspaceDockableBlockIds.includes(id as WorkspaceBlockId)) : ['actions'] as WorkspaceBlockId[];
    const compactPlaylistEnabled = Boolean(value.compactPlaylistEnabled ?? value.preset === 'compact-control');
    const collapsed = Array.isArray(value.collapsed)
      ? value.collapsed.filter((id): id is WorkspaceBlockId => workspaceCollapsibleBlockIds.includes(id as WorkspaceBlockId))
      : compactPlaylistEnabled && !value.compactPlaylistOpen ? ['playlist'] as WorkspaceBlockId[] : [];
    const expandedItems = Array.isArray(storedItems) ? expandCategorySpace(storedItems) : storedItems;
    const items = Array.isArray(expandedItems) && layoutItemsAreValid(expandedItems, value.columns, dock, compactPlaylistEnabled) ? expandedItems : storedItems;
    if (!workspaceLayoutColumns.includes(value.columns) || !Array.isArray(items) || !layoutItemsAreValid(items, value.columns, dock, compactPlaylistEnabled)) return createWorkspaceLayout();
    return {
      columns: value.columns,
      preset: value.preset in workspacePresetLabels || value.preset === 'custom' ? value.preset : 'custom',
      items,
      dock,
      collapsed,
      compactPlaylistEnabled,
      compactPlaylistOpen: compactPlaylistEnabled ? !collapsed.includes('playlist') : Boolean(value.compactPlaylistOpen),
      compactPlaylistRows: clamp(value.compactPlaylistRows ?? 6, compactPlaylistMinimumRows, compactPlaylistMaximumRows),
    };
  } catch {
    return createWorkspaceLayout();
  }
}

export function workspaceLayoutStorageKey(userId: string): string {
  return `sonoriva-workspace-layout:${userId}`;
}

function replaceWorkspaceItem(layout: WorkspaceLayout, nextItem: WorkspaceLayoutItem): WorkspaceLayout {
  if (!workspaceItemIsDocked(layout, nextItem.id) && layout.items.some((item) => item.id !== nextItem.id && !workspaceItemIsDocked(layout, item.id) && itemsOverlap(item, nextItem))) return layout;
  return { ...layout, preset: 'custom', items: layout.items.map((item) => item.id === nextItem.id ? nextItem : item) };
}

function scaleItems(items: WorkspaceLayoutItem[], fromColumns: number, toColumns: WorkspaceGridColumns): WorkspaceLayoutItem[] {
  return items.map((item) => {
    const x = Math.round(item.x / fromColumns * toColumns);
    const right = Math.round((item.x + item.w) / fromColumns * toColumns);
    return { ...item, x, w: Math.max(1, right - x) };
  });
}

function expandCategorySpace(items: WorkspaceLayoutItem[]): WorkspaceLayoutItem[] {
  const category = items.find((item) => item.id === 'categories');
  const minimumHeight = minimumSizes.categories.h;
  if (!category || category.h >= minimumHeight || category.y + minimumHeight > workspaceLayoutRows) return items;
  const previousBottom = category.y + category.h;
  const offset = minimumHeight - category.h;
  return items.map((item) => {
    if (item.id === 'categories') return { ...item, h: minimumHeight };
    const overlapsHorizontally = item.x < category.x + category.w && item.x + item.w > category.x;
    if (!overlapsHorizontally || item.y < previousBottom) return item;
    const y = item.y + offset;
    return { ...item, y, h: Math.min(item.h, workspaceLayoutRows - y) };
  });
}

function layoutItemsAreValid(items: WorkspaceLayoutItem[], columns: WorkspaceGridColumns, dock: WorkspaceBlockId[], compactPlaylistEnabled: boolean): boolean {
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== 5 || !(['actions', 'categories', 'soundboard', 'players', 'playlist'] as WorkspaceBlockId[]).every((id) => ids.has(id))) return false;
  if (new Set(dock).size !== dock.length || dock.some((id) => !ids.has(id))) return false;
  const effectiveDock = new Set(dock);
  if (compactPlaylistEnabled && dock.some((id) => id === 'players' || id === 'playlist')) {
    effectiveDock.add('players');
    effectiveDock.add('playlist');
  }
  return items.every((item) => Number.isInteger(item.x) && Number.isInteger(item.y) && Number.isInteger(item.w) && Number.isInteger(item.h)
    && item.x >= 0 && item.y >= 0 && item.w > 0 && item.h > 0 && item.x + item.w <= columns && item.y + item.h <= workspaceLayoutRows)
    && items.filter((item) => !effectiveDock.has(item.id)).every((item, index, gridItems) => gridItems.slice(index + 1).every((other) => !itemsOverlap(item, other)));
}

function itemsOverlap(first: WorkspaceLayoutItem, second: WorkspaceLayoutItem): boolean {
  return first.x < second.x + second.w && first.x + first.w > second.x && first.y < second.y + second.h && first.y + first.h > second.y;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
