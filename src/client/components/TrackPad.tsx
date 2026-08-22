import { Infinity as InfinityIcon, MoreHorizontal, Pause, Play } from 'lucide-react';
import type { Track } from '../types';

interface Props {
  track: Track;
  color: string;
  active: boolean;
  remote: boolean;
  shortcut?: number;
  onPlay: () => void;
  onStop: () => void;
  onEdit: () => void;
}

export function TrackPad({ track, color, active, remote, shortcut, onPlay, onStop, onEdit }: Props) {
  return <article className={`track-pad ${active ? 'is-active' : ''}`} style={{ '--track-color': color } as React.CSSProperties}>
    <div className="track-pad-top">
      <span className="track-type">{track.mimeType.split('/')[1]?.toUpperCase()}</span>
      <button className="icon-button subtle" onClick={onEdit} aria-label={`Modifier ${track.title}`}><MoreHorizontal size={18} /></button>
    </div>
    <button className="track-trigger" onClick={active && !remote ? onStop : onPlay}>
      <span className="play-disc">{active ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</span>
      <span className="track-title">{track.title}</span>
      <span className="track-file">{track.originalFilename}</span>
    </button>
    <div className="track-meta">
      <span>{track.durationMs ? formatDuration((track.endTimeMs ?? track.durationMs) - track.startTimeMs) : '—:—'}</span>
      <span>{track.loop && <InfinityIcon size={15} />}{shortcut ? `Touche ${shortcut}` : `${Math.round(track.volume * 100)} %`}</span>
    </div>
  </article>;
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
