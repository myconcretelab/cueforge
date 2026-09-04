import { ChevronDown, Music2, Pencil } from 'lucide-react';
import { contrastColor } from '../lib/color-contrast';
import type { Track, TrackSubcategory } from '../types';

interface Props {
  subcategory: TrackSubcategory;
  tracks: Track[];
  open: boolean;
  reorderEnabled: boolean;
  dropTarget: boolean;
  positionTarget?: 'before' | 'after';
  onToggle: () => void;
  onEdit: () => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function TrackSubcategoryPad({ subcategory, tracks, open, reorderEnabled, dropTarget, positionTarget, onToggle, onEdit, onDragOver, onDragLeave, onDrop, onDragStart, onDragEnd }: Props) {
  const previews = tracks.slice(0, 4);
  return <article className={`track-pad subcategory-pad ${open ? 'is-open' : ''} ${reorderEnabled ? 'reorder-enabled' : ''} ${dropTarget ? 'is-drop-target' : ''} ${positionTarget ? `reorder-position-target drop-${positionTarget}` : ''}`} style={{ '--track-color': subcategory.color, '--track-contrast': contrastColor(subcategory.color) } as React.CSSProperties} draggable={reorderEnabled}
    onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onDragEnd={onDragEnd}>
    <div className="subcategory-titlebar">
      <span className="subcategory-count-badge" aria-label={`${tracks.length} morceau${tracks.length !== 1 ? 'x' : ''}`}>{tracks.length > 99 ? '99+' : tracks.length}</span>
      <strong className="subcategory-edge-title">{subcategory.name}</strong>
      <button type="button" className="subcategory-edit-button" onClick={onEdit} aria-label={`Modifier ${subcategory.name}`} title="Modifier"><Pencil size={14} /></button>
    </div>
    <button type="button" className="subcategory-trigger" onClick={onToggle} aria-expanded={open}>
      <span className="subcategory-mosaic" aria-hidden="true">
        {previews.map((track) => <i key={track.id} style={{ '--preview-color': track.color ?? subcategory.color } as React.CSSProperties}><Music2 size={13} /></i>)}
        {Array.from({ length: Math.max(0, 4 - previews.length) }, (_, index) => <i className="empty" key={`empty-${index}`} />)}
      </span>
      <span className="subcategory-open-label">{open ? 'Fermer' : 'Ouvrir'}<ChevronDown size={14} /></span>
    </button>
    <div className="track-meta"><span>Groupe</span><span>{open ? 'Tiroir ouvert' : 'Sous-catégorie'}</span></div>
  </article>;
}
