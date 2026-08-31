import { describe, expect, it } from 'vitest';
import {
  createWorkspaceLayout,
  moveWorkspaceItem,
  readWorkspaceLayout,
  resizeWorkspaceItem,
  swapWorkspaceItems,
  workspaceLayoutItem,
  workspaceLayoutStorageKey,
  workspaceLayoutWithColumns,
} from '../src/client/lib/workspace-layout';

describe('workspace layout', () => {
  it('provides a full-height playlist preset', () => {
    const layout = createWorkspaceLayout('playlist-vertical');
    expect(workspaceLayoutItem(layout, 'playlist')).toMatchObject({ x: 0, y: 0, w: 4, h: 12 });
  });

  it('provides a compact control preset with a docked playlist slot', () => {
    const layout = createWorkspaceLayout('compact-control');
    expect(workspaceLayoutItem(layout, 'players')).toMatchObject({ x: 9, y: 0, w: 3, h: 8 });
    expect(workspaceLayoutItem(layout, 'playlist')).toMatchObject({ x: 9, y: 8, w: 3, h: 4 });
    expect(layout).toMatchObject({ compactPlaylistOpen: false, compactPlaylistRows: 6 });
  });

  it('keeps the proportions when the grid resolution changes', () => {
    const layout = workspaceLayoutWithColumns(createWorkspaceLayout('classic'), 6);
    expect(workspaceLayoutItem(layout, 'categories')).toMatchObject({ x: 0, w: 5 });
    expect(workspaceLayoutItem(layout, 'players')).toMatchObject({ x: 5, w: 1 });
  });

  it('rejects moves and resizes that overlap another block', () => {
    const layout = createWorkspaceLayout('classic');
    expect(moveWorkspaceItem(layout, 'playlist', 8, 5)).toBe(layout);
    expect(resizeWorkspaceItem(layout, 'players', 4, 8)).toBe(layout);
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
    expect(workspaceLayoutItem(swapped, 'players')).toMatchObject({ x: 9, y: 6, w: 3, h: 6 });
    expect(workspaceLayoutItem(swapped, 'playlist')).toMatchObject({ x: 9, y: 0, w: 3, h: 6 });
  });

  it('falls back safely when persisted data is invalid', () => {
    const invalid = JSON.stringify({ columns: 12, preset: 'custom', items: [{ id: 'playlist', x: 0, y: 0, w: 20, h: 12 }] });
    expect(readWorkspaceLayout(invalid).preset).toBe('classic');
    expect(readWorkspaceLayout('{')).toEqual(createWorkspaceLayout());
  });

  it('restores and clamps the compact playlist drawer preferences', () => {
    const serialized = JSON.stringify({ ...createWorkspaceLayout('compact-control'), compactPlaylistOpen: true, compactPlaylistRows: 20 });
    expect(readWorkspaceLayout(serialized)).toMatchObject({ preset: 'compact-control', compactPlaylistOpen: true, compactPlaylistRows: 9 });
  });

  it('uses a distinct persistence key for each user', () => {
    expect(workspaceLayoutStorageKey('user-a')).not.toBe(workspaceLayoutStorageKey('user-b'));
  });
});
