import type { DragEvent } from 'react';
import { Blend, Clock3, ListMusic, Play, Repeat2, Shuffle, Zap } from 'lucide-react';
import type { Playlist } from '../types';

interface Props {
  playlist: Playlist;
  reorderEnabled: boolean;
  dropTarget: boolean;
  dropAfter: boolean;
  onLoad: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function PlaylistPad({ playlist, reorderEnabled, dropTarget, dropAfter, onLoad, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  return <article className={`track-pad playlist-pad ${reorderEnabled ? 'reorder-enabled' : ''} ${dropTarget ? `is-drop-target ${dropAfter ? 'drop-after' : 'drop-before'}` : ''}`} style={{ '--track-color': playlist.color } as React.CSSProperties} draggable={reorderEnabled}
    onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}>
    <button className="track-trigger" onClick={onLoad} aria-label={`Charger la playlist ${playlist.name}`}>
      <span className="play-disc"><ListMusic size={18} /></span>
      <span className="track-title">{playlist.name}</span>
      <span className="playlist-pad-options">{playlist.autostart && <Zap size={12} />}{playlist.loop && <Repeat2 size={12} />}{playlist.random && <Shuffle size={12} />}{playlist.gapMs > 0 && <Clock3 size={12} />}{playlist.crossfadeMs > 0 && <Blend size={12} />}</span>
    </button>
    <div className="track-meta"><span>{playlist.trackIds.length} titre{playlist.trackIds.length !== 1 ? 's' : ''}</span><span>{playlist.autostart ? <><Play size={12} fill="currentColor" /> Auto</> : 'Charger'}</span></div>
  </article>;
}
