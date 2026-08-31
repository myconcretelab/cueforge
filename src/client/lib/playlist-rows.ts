import type { PlaylistEntry } from '../types';

export interface PlaylistQueueItem {
  id: string;
  trackId: string;
  rowId: string;
}

export interface PlaylistQueueRow {
  id: string;
  items: PlaylistQueueItem[];
}

export type PlaylistItemPlacement = 'group' | 'before' | 'after';

export function playlistRows(items: PlaylistQueueItem[]): PlaylistQueueRow[] {
  const rows: PlaylistQueueRow[] = [];
  const rowsById = new Map<string, PlaylistQueueRow>();
  for (const item of items) {
    let row = rowsById.get(item.rowId);
    if (!row) {
      row = { id: item.rowId, items: [] };
      rowsById.set(item.rowId, row);
      rows.push(row);
    }
    row.items.push(item);
  }
  return rows;
}

export function playlistEntries(items: PlaylistQueueItem[]): PlaylistEntry[] {
  return playlistRows(items).flatMap((row, rowIndex) => row.items.map((item) => ({ trackId: item.trackId, rowIndex })));
}

export function playlistQueueItems(entries: PlaylistEntry[], createId: () => string): PlaylistQueueItem[] {
  const rowIds = new Map<number, string>();
  return entries.map((entry) => {
    const rowId = rowIds.get(entry.rowIndex) ?? createId();
    rowIds.set(entry.rowIndex, rowId);
    return { id: createId(), trackId: entry.trackId, rowId };
  });
}

export function movePlaylistItem(items: PlaylistQueueItem[], itemId: string, targetRowId: string, placement: PlaylistItemPlacement, maxGroupSize: number): { items: PlaylistQueueItem[]; changed: boolean; limitReached: boolean } {
  const rows = playlistRows(items).map((row) => ({ ...row, items: [...row.items] }));
  const sourceRow = rows.find((row) => row.items.some((item) => item.id === itemId));
  const targetRow = rows.find((row) => row.id === targetRowId);
  const moving = sourceRow?.items.find((item) => item.id === itemId);
  if (!sourceRow || !targetRow || !moving) return { items, changed: false, limitReached: false };
  if (placement === 'group' && sourceRow.id === targetRow.id) return { items, changed: false, limitReached: false };
  if (placement === 'group' && targetRow.items.length >= maxGroupSize) return { items, changed: false, limitReached: true };

  sourceRow.items = sourceRow.items.filter((item) => item.id !== itemId);
  const remainingRows = rows.filter((row) => row.items.length > 0);
  const remainingTargetIndex = remainingRows.findIndex((row) => row.id === targetRowId);
  if (remainingTargetIndex < 0) return { items, changed: false, limitReached: false };

  if (placement === 'group') {
    remainingRows[remainingTargetIndex]!.items.push({ ...moving, rowId: targetRowId });
  } else {
    const rowId = `row-${moving.id}`;
    remainingRows.splice(remainingTargetIndex + (placement === 'after' ? 1 : 0), 0, {
      id: rowId,
      items: [{ ...moving, rowId }],
    });
  }
  return { items: remainingRows.flatMap((row) => row.items), changed: true, limitReached: false };
}
