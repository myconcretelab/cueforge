import { ListMusic, Play, Repeat2, Shuffle, Zap } from 'lucide-react';
import type { Playlist } from '../types';

interface Props { playlist: Playlist; onLoad: () => void }

export function PlaylistPad({ playlist, onLoad }: Props) {
  return <article className="track-pad playlist-pad" style={{ '--track-color': playlist.color } as React.CSSProperties}>
    <button className="track-trigger" onClick={onLoad} aria-label={`Charger la playlist ${playlist.name}`}>
      <span className="play-disc"><ListMusic size={18} /></span>
      <span className="track-title">{playlist.name}</span>
      <span className="playlist-pad-options">{playlist.autostart && <Zap size={12} />}{playlist.loop && <Repeat2 size={12} />}{playlist.random && <Shuffle size={12} />}</span>
    </button>
    <div className="track-meta"><span>{playlist.trackIds.length} titre{playlist.trackIds.length !== 1 ? 's' : ''}</span><span>{playlist.autostart ? <><Play size={12} fill="currentColor" /> Auto</> : 'Charger'}</span></div>
  </article>;
}
