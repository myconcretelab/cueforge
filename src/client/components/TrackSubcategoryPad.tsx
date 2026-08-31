import { ChevronDown, Folder, MoreHorizontal, Music2 } from 'lucide-react';
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
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function TrackSubcategoryPad({ subcategory, tracks, open, reorderEnabled, dropTarget, positionTarget, onToggle, onEdit, onDragOver, onDrop, onDragStart, onDragEnd }: Props) {
  const previews = tracks.slice(0, 4);
  return <article className={`track-pad subcategory-pad ${open ? 'is-open' : ''} ${reorderEnabled ? 'reorder-enabled' : ''} ${dropTarget ? 'is-drop-target' : ''} ${positionTarget ? `reorder-position-target drop-${positionTarget}` : ''}`} style={{ '--track-color': subcategory.color } as React.CSSProperties} draggable={reorderEnabled}
    onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}>
    <span className="subcategory-count-badge" aria-label={`${tracks.length} morceau${tracks.length !== 1 ? 'x' : ''}`}>{tracks.length > 99 ? '99+' : tracks.length}</span>
    <span className="subcategory-edge-title">{subcategory.name}</span>
    <button type="button" className="icon-button subtle track-edit" onClick={onEdit} aria-label={`Modifier ${subcategory.name}`}><MoreHorizontal size={18} /></button>
    <button type="button" className="subcategory-trigger" onClick={onToggle} aria-expanded={open}>
      <span className="subcategory-mosaic" aria-hidden="true">
        {previews.map((track) => <i key={track.id} style={{ '--preview-color': track.color ?? subcategory.color } as React.CSSProperties}><Music2 size={13} /></i>)}
        {Array.from({ length: Math.max(0, 4 - previews.length) }, (_, index) => <i className="empty" key={`empty-${index}`}><Folder size={13} /></i>)}
      </span>
      <span className="subcategory-open-label">{open ? 'Fermer' : 'Ouvrir'}<ChevronDown size={14} /></span>
    </button>
    <div className="track-meta"><span>Groupe</span><span>{open ? 'Tiroir ouvert' : 'Sous-catégorie'}</span></div>
  </article>;
}
