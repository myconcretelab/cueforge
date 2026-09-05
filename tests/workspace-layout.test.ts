import { describe, expect, it } from 'vitest';
import {
  createWorkspaceLayout,
  dockWorkspaceItem,
  moveWorkspaceItem,
  readSavedWorkspaceLayouts,
  readWorkspaceLayout,
  resizeWorkspaceItem,
  setWorkspaceItemCollapsed,
  swapWorkspaceItems,
  workspaceDockItems,
  workspaceItemIsDocked,
  workspaceItemIsCollapsed,
  workspaceLayoutItem,
  workspaceLayoutsMatch,
  workspaceLayoutSnapshot,
  workspaceLayoutStorageKey,
  workspaceLayoutWithColumns,
  workspaceSavedLayoutsStorageKey,
} from '../src/client/lib/workspace-layout';

describe('workspace layout', () => {
  it('places actions, playbacks and playlist in the left dock by default', () => {
    const layout = createWorkspaceLayout();
    expect(layout.dock).toEqual(['actions', 'players', 'playlist']);
    expect(workspaceItemIsDocked(layout, 'actions')).toBe(true);
    expect(workspaceItemIsDocked(layout, 'players')).toBe(true);
    expect(workspaceItemIsDocked(layout, 'playlist')).toBe(true);
    expect(workspaceLayoutItem(layout, 'categories')).toMatchObject({ x: 0, y: 0, w: 12, h: 3 });
    expect(workspaceLayoutItem(layout, 'soundboard')).toMatchObject({ x: 0, y: 3, w: 12, h: 9 });
  });

  it('provides a full-height playlist preset', () => {
    const layout = createWorkspaceLayout('playlist-vertical');
    expect(workspaceLayoutItem(layout, 'playlist')).toMatchObject({ x: 0, y: 0, w: 4, h: 12 });
  });

  it('provides a compact control preset with a docked playlist slot', () => {
    const layout = createWorkspaceLayout('compact-control');
    expect(workspaceLayoutItem(layout, 'players')).toMatchObject({ x: 9, y: 0, w: 3, h: 8 });
    expect(workspaceLayoutItem(layout, 'playlist')).toMatchObject({ x: 9, y: 8, w: 3, h: 4 });
    expect(layout).toMatchObject({ collapsed: ['playlist'], compactPlaylistEnabled: true, compactPlaylistOpen: false, compactPlaylistRows: 6 });
  });

  it('collapses reusable modules and keeps the compact playlist state aligned', () => {
    const compact = createWorkspaceLayout('compact-control');
    const opened = setWorkspaceItemCollapsed(compact, 'playlist', false);
    expect(workspaceItemIsCollapsed(opened, 'playlist')).toBe(false);
    expect(opened.compactPlaylistOpen).toBe(true);
    const actionsCollapsed = setWorkspaceItemCollapsed(opened, 'actions', true);
    expect(workspaceItemIsCollapsed(actionsCollapsed, 'actions')).toBe(true);
  });

  it('keeps compact players and their playlist together in the left dock', () => {
    const layout = dockWorkspaceItem(createWorkspaceLayout('compact-control'), 'players');
    expect(workspaceDockItems(layout)).toEqual(['actions', 'players', 'playlist']);
    expect(workspaceItemIsDocked(layout, 'playlist')).toBe(true);
    expect(workspaceLayoutItem(layout, 'categories').w).toBe(12);
    expect(workspaceLayoutItem(layout, 'soundboard').w).toBe(12);
  });

  it('keeps the proportions when the grid resolution changes', () => {
    const layout = workspaceLayoutWithColumns(createWorkspaceLayout('classic'), 6);
    expect(workspaceLayoutItem(layout, 'categories')).toMatchObject({ x: 0, w: 6 });
    expect(workspaceLayoutItem(layout, 'players')).toMatchObject({ x: 5, w: 1 });
  });

  it('normalizes persisted layouts to the fixed twelve-column grid', () => {
    const restored = readWorkspaceLayout(JSON.stringify(createWorkspaceLayout('classic', 6)));
    expect(restored.columns).toBe(12);
    expect(workspaceLayoutItem(restored, 'players')).toMatchObject({ x: 10, w: 2 });
  });

  it('rejects moves and resizes that overlap another block', () => {
    const layout = createWorkspaceLayout('classic');
    expect(moveWorkspaceItem(layout, 'categories', 0, 3)).toBe(layout);
    expect(resizeWorkspaceItem(layout, 'categories', 12, 4)).toBe(layout);
  });

  it('accepts a resize inside the free geometry and marks the layout custom', () => {
    const layout = createWorkspaceLayout('playlist-focus');
    const resized = resizeWorkspaceItem(layout, 'players', 4, 3);
    expect(workspaceLayoutItem(resized, 'players').h).toBe(3);
    expect(resized.preset).toBe('custom');
  });

  it('swaps two complete block slots without creating overlap', () => {
    const layout = createWorkspaceLayout('classic');
    const swapped = swapWorkspaceItems(layout, 'players', 'playlist');
    expect(workspaceDockItems(swapped)).toEqual(['actions', 'playlist', 'players']);
    expect(workspaceLayoutItem(swapped, 'players')).toMatchObject({ x: 9, y: 0, w: 3, h: 6 });
    expect(workspaceLayoutItem(swapped, 'playlist')).toMatchObject({ x: 9, y: 6, w: 3, h: 6 });
  });

  it('exchanges a docked block with a compatible grid block', () => {
    const layout = swapWorkspaceItems(createWorkspaceLayout('playlist-vertical'), 'actions', 'players');
    expect(workspaceDockItems(layout)).toEqual(['players']);
    expect(workspaceItemIsDocked(layout, 'actions')).toBe(false);
    expect(workspaceLayoutItem(layout, 'actions')).toMatchObject({ x: 10, y: 3, w: 2, h: 9 });
  });

  it('moves the compact player and playlist pair into the dock when actions take its slot', () => {
    const layout = swapWorkspaceItems(createWorkspaceLayout('compact-control'), 'actions', 'players');
    expect(workspaceDockItems(layout)).toEqual(['players', 'playlist']);
    expect(workspaceItemIsDocked(layout, 'actions')).toBe(false);
    expect(workspaceLayoutItem(layout, 'actions')).toMatchObject({ x: 9, y: 0, w: 3, h: 12 });
    const restored = swapWorkspaceItems(layout, 'actions', 'players');
    expect(workspaceDockItems(restored)).toEqual(['actions']);
    expect(workspaceLayoutItem(restored, 'players')).toMatchObject({ x: 9, y: 0, w: 3, h: 6 });
    expect(workspaceLayoutItem(restored, 'playlist')).toMatchObject({ x: 9, y: 6, w: 3, h: 6 });
  });

  it('falls back safely when persisted data is invalid', () => {
    const invalid = JSON.stringify({ columns: 12, preset: 'custom', items: [{ id: 'playlist', x: 0, y: 0, w: 20, h: 12 }] });
    expect(readWorkspaceLayout(invalid).preset).toBe('classic');
    expect(readWorkspaceLayout('{')).toEqual(createWorkspaceLayout());
  });

  it('restores and clamps the compact playlist drawer preferences', () => {
    const opened = setWorkspaceItemCollapsed(createWorkspaceLayout('compact-control'), 'playlist', false);
    const serialized = JSON.stringify({ ...opened, compactPlaylistRows: 20 });
    expect(readWorkspaceLayout(serialized)).toMatchObject({ preset: 'compact-control', compactPlaylistOpen: true, compactPlaylistRows: 9 });
  });

  it('migrates layouts saved before the left dock existed', () => {
    const current = createWorkspaceLayout();
    const legacy = JSON.stringify({ columns: current.columns, preset: current.preset, items: current.items.filter((item) => item.id !== 'actions') });
    const migrated = readWorkspaceLayout(legacy);
    expect(workspaceLayoutItem(migrated, 'actions').id).toBe('actions');
    expect(migrated.dock).toEqual(['actions', 'players', 'playlist']);
    expect(migrated.collapsed).toEqual([]);
  });

  it('migrates the former classic right column into the left dock', () => {
    const current = createWorkspaceLayout();
    const legacy = JSON.stringify({
      ...current,
      dock: ['actions'],
      items: current.items.map((item) => item.id === 'categories' || item.id === 'soundboard' ? { ...item, w: 9 } : item),
    });
    const migrated = readWorkspaceLayout(legacy);
    expect(migrated.dock).toEqual(['actions', 'players', 'playlist']);
    expect(workspaceLayoutItem(migrated, 'categories')).toMatchObject({ x: 0, w: 12 });
    expect(workspaceLayoutItem(migrated, 'soundboard')).toMatchObject({ x: 0, w: 12 });
  });

  it('migrates the compact playlist drawer to the reusable collapsed state', () => {
    const current = createWorkspaceLayout('compact-control');
    const legacy = { ...current, collapsed: undefined };
    expect(readWorkspaceLayout(JSON.stringify(legacy)).collapsed).toEqual(['playlist']);
    expect(readWorkspaceLayout(JSON.stringify({ ...legacy, compactPlaylistOpen: true })).collapsed).toEqual([]);
  });

  it('expands categories in layouts saved with the former two-row height', () => {
    const current = createWorkspaceLayout();
    const legacyItems = current.items.map((item) => item.id === 'categories' ? { ...item, h: 2 } : item.id === 'soundboard' ? { ...item, y: 2, h: 10 } : item);
    const migrated = readWorkspaceLayout(JSON.stringify({ ...current, preset: 'custom', items: legacyItems }));
    expect(workspaceLayoutItem(migrated, 'categories')).toMatchObject({ y: 0, h: 3 });
    expect(workspaceLayoutItem(migrated, 'soundboard')).toMatchObject({ y: 3, h: 9 });
  });

  it('uses a distinct persistence key for each user', () => {
    expect(workspaceLayoutStorageKey('user-a')).not.toBe(workspaceLayoutStorageKey('user-b'));
    expect(workspaceSavedLayoutsStorageKey('user-a')).not.toBe(workspaceSavedLayoutsStorageKey('user-b'));
  });

  it('reads named layouts and compares them independently from their preset label', () => {
    const layout = createWorkspaceLayout('playlist-focus');
    const serialized = JSON.stringify([{ id: 'layout-1', name: '  Ma régie  ', layout }]);
    const saved = readSavedWorkspaceLayouts(serialized);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ id: 'layout-1', name: 'Ma régie', layout: { columns: 12, preset: 'custom' } });
    expect(workspaceLayoutsMatch(saved[0]!.layout, layout)).toBe(true);
    expect(workspaceLayoutSnapshot(layout)).not.toBe(layout);
  });
});
