import { AudioWaveform, CircleCheck, Infinity as InfinityIcon, MoreHorizontal, Play } from 'lucide-react';
import type { ActivePlayback } from '../lib/audio-engine';
import type { Track } from '../types';

interface Props {
  track: Track;
  color: string;
  active: boolean;
  playback?: ActivePlayback;
  loaded: boolean;
  reorderEnabled: boolean;
  dropTarget: boolean;
  shortcut?: number;
  onPrimary: () => void;
  onSecondary: () => void;
  onEdit: () => void;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function TrackPad({ track, color, active, playback, loaded, reorderEnabled, dropTarget, shortcut, onPrimary, onSecondary, onEdit, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  const progressStyle = playback ? {
    '--progress-duration': `${playback.durationMs}ms`,
    '--progress-delay': `-${Math.max(0, performance.now() - playback.startedAtMs)}ms`,
    '--progress-iterations': playback.loop ? 'infinite' : '1',
  } as React.CSSProperties : undefined;
  return <article className={`track-pad ${active ? 'is-active' : ''} ${reorderEnabled ? 'reorder-enabled' : ''} ${dropTarget ? 'is-drop-target' : ''}`}
    style={{ '--track-color': color } as React.CSSProperties} draggable={reorderEnabled}
    onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}>
    {loaded && <span className="track-loaded" title="Son préchargé" aria-label="Son préchargé"><CircleCheck size={15} /></span>}
    <button className="icon-button subtle track-edit" onClick={onEdit} aria-label={`Modifier ${track.title}`}><MoreHorizontal size={18} /></button>
    <button className="track-trigger" onClick={() => !reorderEnabled && onPrimary()} onContextMenu={(event) => { event.preventDefault(); if (!reorderEnabled) onSecondary(); }}>
      <span className="play-disc">{active ? <AudioWaveform size={18} /> : <Play size={18} fill="currentColor" />}</span>
      <span className="track-title">{track.title}</span>
    </button>
    {playback && <span className="track-progress" key={playback.id} aria-hidden="true"><i style={progressStyle} /></span>}
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
