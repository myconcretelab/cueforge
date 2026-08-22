import { AudioWaveform, CircleCheck, Infinity as InfinityIcon, MoreHorizontal, Play } from 'lucide-react';
import type { Track } from '../types';

interface Props {
  track: Track;
  color: string;
  active: boolean;
  loaded: boolean;
  shortcut?: number;
  onPrimary: () => void;
  onSecondary: () => void;
  onEdit: () => void;
}

export function TrackPad({ track, color, active, loaded, shortcut, onPrimary, onSecondary, onEdit }: Props) {
  return <article className={`track-pad ${active ? 'is-active' : ''}`} style={{ '--track-color': color } as React.CSSProperties}>
    {loaded && <span className="track-loaded" title="Son préchargé" aria-label="Son préchargé"><CircleCheck size={15} /></span>}
    <button className="icon-button subtle track-edit" onClick={onEdit} aria-label={`Modifier ${track.title}`}><MoreHorizontal size={18} /></button>
    <button className="track-trigger" onClick={onPrimary} onContextMenu={(event) => { event.preventDefault(); onSecondary(); }}>
      <span className="play-disc">{active ? <AudioWaveform size={18} /> : <Play size={18} fill="currentColor" />}</span>
      <span className="track-title">{track.title}</span>
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
