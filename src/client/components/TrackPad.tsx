import { AudioWaveform, CircleCheck, Infinity as InfinityIcon, MoreHorizontal, Play } from 'lucide-react';
import type { ActivePlayback } from '../lib/audio-engine';
import type { Track } from '../types';

interface Props {
  track: Track;
  color: string;
  active: boolean;
  playbacks: ActivePlayback[];
  historyProgress: number;
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

export function TrackPad({ track, color, active, playbacks, historyProgress, loaded, reorderEnabled, dropTarget, shortcut, onPrimary, onSecondary, onEdit, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  return <article className={`track-pad ${active ? 'is-active' : ''} ${reorderEnabled ? 'reorder-enabled' : ''} ${dropTarget ? 'is-drop-target' : ''}`}
    style={{ '--track-color': color } as React.CSSProperties} draggable={reorderEnabled}
    onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}>
    {loaded && <span className="track-loaded" title="Son préchargé" aria-label="Son préchargé"><CircleCheck size={15} /></span>}
    <button className="icon-button subtle track-edit" onClick={onEdit} aria-label={`Modifier ${track.title}`}><MoreHorizontal size={18} /></button>
    <button className="track-trigger" onClick={() => !reorderEnabled && onPrimary()} onContextMenu={(event) => { event.preventDefault(); if (!reorderEnabled) onSecondary(); }}>
      <span className="play-disc">{active ? <AudioWaveform size={18} /> : <Play size={18} fill="currentColor" />}</span>
      <span className="track-title">{track.title}</span>
    </button>
    {(historyProgress > 0 || playbacks.length > 0) && <span className={`track-progress ${playbacks.length > 0 ? 'is-playing' : ''}`} aria-hidden="true">
      {historyProgress > 0 && <i className="history" style={{ transform: `scaleX(${historyProgress})` }} />}
      {playbacks.map((playback) => <i className="active" key={playback.id} style={{
        '--progress-duration': `${playback.durationMs}ms`,
        '--progress-delay': `-${playback.paused ? playback.elapsedMs : playback.elapsedMs + Math.max(0, performance.now() - playback.resumedAtMs)}ms`,
        '--progress-iterations': playback.loop ? 'infinite' : '1',
        animationPlayState: playback.paused ? 'paused' : 'running',
      } as React.CSSProperties} />)}
    </span>}
    <div className="track-meta">
      <span>{track.durationMs ? formatDuration((track.endTimeMs ?? track.durationMs) - track.startTimeMs) : '—:—'}</span>
      <span>{track.loop && <InfinityIcon size={15} />}{shortcut ? `Touche ${shortcut}` : `${Math.min(100, Math.round(track.volume * 100))} %`}</span>
    </div>
  </article>;
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
