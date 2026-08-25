import { useRef, useState } from 'react';
import { Blend, Clock3, GripHorizontal, GripVertical, ListMusic, LoaderCircle, Pause, Play, Repeat2, Save, Shuffle, SkipForward, SlidersHorizontal, Square, Trash2, X, Zap } from 'lucide-react';
import type { ProjectColor, Track } from '../types';

export interface PlaylistQueueItem { id: string; trackId: string }
export interface PlaylistOptions { name: string; color: string; autostart: boolean; loop: boolean; random: boolean; gapMs: number; crossfadeMs: number }

interface Props {
  items: PlaylistQueueItem[];
  tracks: Track[];
  colors: ProjectColor[];
  options: PlaylistOptions;
  currentIndex: number;
  playbackActive: boolean;
  playbackPaused: boolean;
  saved: boolean;
  saving: boolean;
  optionsOpen: boolean;
  onOptionsOpenChange: (open: boolean) => void;
  onOptionsChange: (patch: Partial<PlaylistOptions>) => void;
  onDropTrack: (trackId: string) => void;
  onMoveItem: (itemId: string, beforeItemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onPlayItem: (index: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onSave: () => void;
  onDelete: () => void;
  onClear: () => void;
}

const trackMime = 'application/x-cueforge-track';
const playlistItemMime = 'application/x-cueforge-playlist-item';
const panelHeightStorageKey = 'cueforge-playlist-panel-height';
const panelMinHeight = 160;

function maxPanelHeight() {
  return Math.max(panelMinHeight, Math.min(680, window.innerHeight - 390));
}

function clampPanelHeight(height: number) {
  return Math.min(maxPanelHeight(), Math.max(panelMinHeight, height));
}

function formatTransitionDuration(durationMs: number) {
  if (durationMs === 0) return 'Aucun';
  return `${(durationMs / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s`;
}

export function PlaylistPanel({ items, tracks, colors, options, currentIndex, playbackActive, playbackPaused, saved, saving, optionsOpen, onOptionsOpenChange, onOptionsChange, onDropTrack, onMoveItem, onRemoveItem, onPlayItem, onPlayPause, onStop, onNext, onSave, onDelete, onClear }: Props) {
  const [panelHeight, setPanelHeight] = useState(() => {
    const storedHeight = Number(localStorage.getItem(panelHeightStorageKey));
    return clampPanelHeight(Number.isFinite(storedHeight) && storedHeight > 0 ? storedHeight : 320);
  });
  const resizeRef = useRef<{ startY: number; startHeight: number; latestHeight: number } | undefined>(undefined);
  const renderedHeight = clampPanelHeight(optionsOpen ? Math.max(panelHeight, 560) : panelHeight);

  function persistHeight(height: number) {
    localStorage.setItem(panelHeightStorageKey, String(Math.round(height)));
  }

  function resizeWithKeyboard(direction: number) {
    setPanelHeight((current) => {
      const next = clampPanelHeight(current + direction * 24);
      persistHeight(next);
      return next;
    });
  }

  return <section className={`playlist-panel ${optionsOpen ? 'options-open' : ''}`} style={{ '--playlist-color': options.color, '--playlist-panel-height': `${renderedHeight}px` } as React.CSSProperties}>
    <div className="playlist-resizer" role="separator" aria-label="Régler la hauteur du panneau playlist" aria-orientation="horizontal" aria-valuemin={panelMinHeight} aria-valuemax={maxPanelHeight()} aria-valuenow={Math.round(renderedHeight)} tabIndex={0} title="Glisser pour régler la hauteur · Flèches haut et bas"
      onKeyDown={(event) => { if (event.key === 'ArrowUp') { event.preventDefault(); resizeWithKeyboard(1); } else if (event.key === 'ArrowDown') { event.preventDefault(); resizeWithKeyboard(-1); } }}
      onPointerDown={(event) => { resizeRef.current = { startY: event.clientY, startHeight: renderedHeight, latestHeight: renderedHeight }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (!resizeRef.current) return; const next = clampPanelHeight(resizeRef.current.startHeight + resizeRef.current.startY - event.clientY); resizeRef.current.latestHeight = next; setPanelHeight(next); }}
      onPointerUp={(event) => { if (!resizeRef.current) return; persistHeight(resizeRef.current.latestHeight); resizeRef.current = undefined; event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { if (resizeRef.current) persistHeight(resizeRef.current.latestHeight); resizeRef.current = undefined; }}><GripHorizontal size={19} /></div>
    <header><div><ListMusic size={15} /><strong>{options.name || 'Nouvelle playlist'}</strong><em>{items.length}</em></div><button type="button" onClick={onClear} disabled={items.length === 0} aria-label="Vider la playlist" title="Vider"><Trash2 size={14} /></button></header>
    <div className="playlist-toolbar">
      <button type="button" onClick={onSave} disabled={items.length === 0 || saving} aria-label="Sauvegarder la playlist" title={saved ? 'Mettre à jour la playlist' : 'Sauvegarder la playlist'}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}</button>
      <button type="button" className={optionsOpen ? 'active' : ''} onClick={() => onOptionsOpenChange(!optionsOpen)} aria-label="Options de la playlist" title="Options"><SlidersHorizontal size={15} /></button>
      <button type="button" onClick={onNext} disabled={items.length === 0} aria-label="Morceau suivant" title="Suivant"><SkipForward size={15} fill="currentColor" /></button>
      <button type="button" onClick={onPlayPause} disabled={items.length === 0} aria-label={playbackActive && !playbackPaused ? 'Mettre la playlist en pause' : 'Lire la playlist'} title={playbackActive && !playbackPaused ? 'Pause' : 'Lecture'}>{playbackActive && !playbackPaused ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
      <button type="button" className="stop" onClick={onStop} disabled={!playbackActive} aria-label="Arrêter la playlist" title="Stop"><Square size={14} fill="currentColor" /></button>
    </div>
    {optionsOpen && <div className="playlist-options">
      <label>Nom<input value={options.name} maxLength={120} onChange={(event) => onOptionsChange({ name: event.target.value })} /></label>
      <label>Couleur<div className="playlist-color-choice"><input type="color" value={options.color} onChange={(event) => onOptionsChange({ color: event.target.value })} />{colors.map((item) => <button type="button" key={item.id} className={item.color.toLowerCase() === options.color.toLowerCase() ? 'active' : ''} style={{ '--swatch-color': item.color } as React.CSSProperties} onClick={() => onOptionsChange({ color: item.color })} aria-label={`Couleur ${item.color}`} />)}</div></label>
      <div className="playlist-option-switches">
        <label><input type="checkbox" checked={options.autostart} onChange={(event) => onOptionsChange({ autostart: event.target.checked })} /><Zap size={13} />Autostart</label>
        <label><input type="checkbox" checked={options.loop} onChange={(event) => onOptionsChange({ loop: event.target.checked })} /><Repeat2 size={13} />Boucle</label>
        <label><input type="checkbox" checked={options.random} onChange={(event) => onOptionsChange({ random: event.target.checked })} /><Shuffle size={13} />Aléatoire</label>
      </div>
      <div className="playlist-transition-options">
        <label><span><Clock3 size={13} />Blanc entre les titres<strong>{formatTransitionDuration(options.gapMs)}</strong></span><input type="range" min="0" max="10000" step="250" value={options.gapMs} onChange={(event) => { const gapMs = Number(event.target.value); onOptionsChange({ gapMs, ...(gapMs > 0 ? { crossfadeMs: 0 } : {}) }); }} /></label>
        <label><span><Blend size={13} />Mix par fondu enchaîné<strong>{formatTransitionDuration(options.crossfadeMs)}</strong></span><input type="range" min="0" max="10000" step="250" value={options.crossfadeMs} onChange={(event) => { const crossfadeMs = Number(event.target.value); onOptionsChange({ crossfadeMs, ...(crossfadeMs > 0 ? { gapMs: 0 } : {}) }); }} /></label>
      </div>
      {saved && <button type="button" className="playlist-delete-saved" onClick={onDelete}><Trash2 size={13} />Supprimer la playlist enregistrée</button>}
    </div>}
    <div className={`playlist-dropzone ${items.length === 0 ? 'empty' : ''}`}
      onDragOver={(event) => { if (event.dataTransfer.types.includes(trackMime)) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
      onDrop={(event) => { const trackId = event.dataTransfer.getData(trackMime); if (!trackId) return; event.preventDefault(); onDropTrack(trackId); }}>
      {items.length === 0 && <div className="playlist-drop-hint"><ListMusic size={22} /><strong>Glissez des morceaux ici</strong><span>Ils seront lus dans cet ordre.</span></div>}
      {items.map((item, index) => {
        const track = tracks.find((candidate) => candidate.id === item.trackId);
        if (!track) return null;
        return <article key={item.id} className={index === currentIndex ? 'current' : ''} draggable
          onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData(playlistItemMime, item.id); }}
          onDragOver={(event) => { if (event.dataTransfer.types.includes(playlistItemMime)) { event.preventDefault(); event.stopPropagation(); } }}
          onDrop={(event) => { const movingId = event.dataTransfer.getData(playlistItemMime); if (!movingId || movingId === item.id) return; event.preventDefault(); event.stopPropagation(); onMoveItem(movingId, item.id); }}>
          <GripVertical size={13} aria-hidden="true" /><button type="button" onClick={() => onPlayItem(index)}><span>{index + 1}</span><strong>{track.title}</strong></button><button type="button" onClick={() => onRemoveItem(item.id)} aria-label={`Retirer ${track.title}`}><X size={12} /></button>
        </article>;
      })}
    </div>
  </section>;
}
