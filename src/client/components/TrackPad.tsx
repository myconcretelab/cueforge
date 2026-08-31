import { AudioWaveform, CircleCheck, Infinity as InfinityIcon, MoreHorizontal, Play } from 'lucide-react';
import type { ActivePlayback } from '../lib/audio-engine';
import type { RoutedBridgeOutput } from '../lib/bridge-output-routing';
import type { Track } from '../types';

interface Props {
  track: Track;
  color: string;
  active: boolean;
  playbacks: ActivePlayback[];
  historyProgress: number;
  loaded: boolean;
  reorderEnabled: boolean;
  playlistDropEnabled: boolean;
  selectionMode: boolean;
  selected: boolean;
  dropTarget: boolean;
  reorderPositionTarget?: 'before' | 'after';
  playlistPositionTarget?: 'before' | 'after';
  shortcut?: string;
  bridgeOutputs: RoutedBridgeOutput[];
  mainBridgeOutputId?: string;
  onPrimary: () => void;
  onOutputPlay: (outputId: string) => void;
  onSecondary: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function TrackPad({ track, color, active, playbacks, historyProgress, loaded, reorderEnabled, playlistDropEnabled, selectionMode, selected, dropTarget, reorderPositionTarget, playlistPositionTarget, shortcut, bridgeOutputs, mainBridgeOutputId, onPrimary, onOutputPlay, onSecondary, onEdit, onSelect, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  const mainOutput = bridgeOutputs.find((output) => output.id === mainBridgeOutputId);
  const alternateOutputs = mainOutput ? bridgeOutputs.filter((output) => output.id !== mainOutput.id) : [];
  return <article className={`track-pad ${active ? 'is-active' : ''} ${reorderEnabled ? 'reorder-enabled' : ''} ${playlistDropEnabled ? 'playlist-drag-enabled' : ''} ${selectionMode ? 'selection-enabled' : ''} ${selected ? 'is-selected' : ''} ${dropTarget ? 'is-drop-target group-drop-target' : ''} ${reorderPositionTarget ? `reorder-position-target drop-${reorderPositionTarget}` : ''} ${playlistPositionTarget ? `playlist-position-target drop-${playlistPositionTarget}` : ''}`}
    style={{ '--track-color': color } as React.CSSProperties} draggable={!selectionMode && (reorderEnabled || playlistDropEnabled)} data-track-id={track.id} onClick={() => selectionMode && onSelect()}
    onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}>
    {selectionMode && <span className="track-selection-indicator" aria-hidden="true">{selected && <CircleCheck size={18} />}</span>}
    {loaded && <span className="track-loaded" title="Disponible hors ligne" aria-label="Disponible hors ligne"><CircleCheck size={15} /></span>}
    <button className="icon-button subtle track-edit" onClick={() => !selectionMode && onEdit()} aria-label={`Modifier ${track.title}`} tabIndex={selectionMode ? -1 : undefined}><MoreHorizontal size={18} /></button>
    <button className="track-trigger" onClick={() => !selectionMode && !reorderEnabled && onPrimary()} onContextMenu={(event) => { event.preventDefault(); if (!selectionMode && !reorderEnabled) onSecondary(); }} aria-pressed={selectionMode ? selected : undefined}>
      <span className={`play-disc ${mainOutput ? 'has-output-route' : ''}`} style={mainOutput ? { '--main-output-color': mainOutput.color } as React.CSSProperties : undefined}>{active ? <AudioWaveform size={18} /> : <Play size={18} fill="currentColor" />}</span>
      <span className="track-title">{track.title}</span>
    </button>
    {alternateOutputs.length > 0 && <div className="track-output-plays" aria-label="Jouer sur une autre sortie">
      {alternateOutputs.map((output) => <button type="button" key={output.id} style={{ '--output-color': output.color } as React.CSSProperties} onClick={() => onOutputPlay(output.id)} aria-label={`Jouer ${track.title} sur ${output.name}`} title={output.name}><Play size={11} fill="currentColor" /></button>)}
    </div>}
    {(historyProgress > 0 || playbacks.length > 0) && <span className={`track-progress ${playbacks.length > 0 ? 'is-playing' : ''}`} aria-hidden="true">
      {playbacks.length === 0 && historyProgress > 0 && <i className="history" style={{ transform: `scaleX(${historyProgress})` }} />}
      {playbacks.map((playback) => <i className="active" key={`${playback.id}:${playback.resumedAtMs}:${playback.elapsedMs}:${playback.paused}`} style={{
        '--progress-duration': `${playback.durationMs}ms`,
        '--progress-delay': `-${playback.elapsedMs}ms`,
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
