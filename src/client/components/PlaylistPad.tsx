import type { DragEvent } from 'react';
import { Blend, Clock3, Layers3, ListMusic, Play, Repeat2, Shuffle, Zap } from 'lucide-react';
import { contrastColor } from '../lib/color-contrast';
import type { Playlist } from '../types';

interface Props {
  playlist: Playlist;
  reorderEnabled: boolean;
  selectionDisabled: boolean;
  dropTarget: boolean;
  dropAfter: boolean;
  onLoad: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function PlaylistPad({ playlist, reorderEnabled, selectionDisabled, dropTarget, dropAfter, onLoad, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  const items = playlist.items?.length ? playlist.items : playlist.trackIds.map((trackId, rowIndex) => ({ trackId, rowIndex }));
  const rowCount = new Set(items.map((item) => item.rowIndex)).size;
  const hasGroups = rowCount < items.length;
  return <article className={`track-pad playlist-pad ${reorderEnabled ? 'reorder-enabled' : ''} ${selectionDisabled ? 'selection-disabled' : ''} ${dropTarget ? `is-drop-target ${dropAfter ? 'drop-after' : 'drop-before'}` : ''}`} style={{ '--track-color': playlist.color, '--track-contrast': contrastColor(playlist.color) } as React.CSSProperties} draggable={reorderEnabled && !selectionDisabled}
    onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}>
    <button className="track-trigger" onClick={() => !selectionDisabled && onLoad()} aria-label={`Charger la playlist ${playlist.name}`} tabIndex={selectionDisabled ? -1 : undefined}>
      <span className="play-disc"><ListMusic size={18} /></span>
      <span className="track-title">{playlist.name}</span>
      <span className="playlist-pad-options">{hasGroups && <Layers3 size={12} />}{playlist.autostart && <Zap size={12} />}{playlist.loop && <Repeat2 size={12} />}{playlist.random && <Shuffle size={12} />}{playlist.gapMs > 0 && <Clock3 size={12} />}{playlist.crossfadeMs > 0 && <Blend size={12} />}</span>
    </button>
    <div className="track-meta"><span>{items.length} titre{items.length !== 1 ? 's' : ''} · {rowCount} rangée{rowCount !== 1 ? 's' : ''}</span><span>{playlist.autostart ? <><Play size={12} fill="currentColor" /> Auto</> : 'Charger'}</span></div>
  </article>;
}
