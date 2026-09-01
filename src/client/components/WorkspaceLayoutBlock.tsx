import { ChevronDown, ChevronUp, Maximize2, Move } from 'lucide-react';
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { workspaceLayoutRows, type WorkspaceBlockId, type WorkspaceLayoutItem } from '../lib/workspace-layout';

export const workspaceBlockMime = 'application/x-sonoriva-workspace-block';

interface Props {
  item: WorkspaceLayoutItem;
  columns: number;
  label: string;
  editing: boolean;
  docked?: boolean;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  moduleIcon?: ReactNode;
  moduleBadge?: ReactNode;
  children: ReactNode;
  onSwap: (sourceId: WorkspaceBlockId, targetId: WorkspaceBlockId) => void;
  onResize: (id: WorkspaceBlockId, width: number, height: number) => void;
  onToggleCollapsed?: () => void;
  onCollapsedDragOver?: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onCollapsedDrop?: (event: ReactDragEvent<HTMLButtonElement>) => void;
}

export function WorkspaceLayoutBlock({ item, columns, label, editing, docked = false, className = '', collapsible = false, collapsed = false, moduleIcon, moduleBadge, children, onSwap, onResize, onToggleCollapsed, onCollapsedDragOver, onCollapsedDrop }: Props) {
  function resize(event: ReactPointerEvent<HTMLButtonElement>) {
    const block = event.currentTarget.closest<HTMLElement>('.workspace-block');
    const grid = event.currentTarget.closest<HTMLElement>('.workspace-layout-grid');
    if (!block || !grid) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const blockBounds = block.getBoundingClientRect();
    const gridBounds = grid.getBoundingClientRect();
    const styles = window.getComputedStyle(grid);
    const columnGap = Number.parseFloat(styles.columnGap) || 0;
    const rowGap = Number.parseFloat(styles.rowGap) || 0;
    const columnUnit = (gridBounds.width - columnGap * (columns - 1)) / columns + columnGap;
    const rowUnit = (gridBounds.height - rowGap * (workspaceLayoutRows - 1)) / workspaceLayoutRows + rowGap;
    const onPointerMove = (moveEvent: PointerEvent) => {
      onResize(item.id, Math.round((moveEvent.clientX - blockBounds.left + columnGap) / columnUnit), Math.round((moveEvent.clientY - blockBounds.top + rowGap) / rowUnit));
    };
    const finish = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }

  const moduleCollapsed = collapsible && collapsed && !editing;

  return <section className={`workspace-block workspace-${item.id} ${editing ? 'is-layout-editing' : ''} ${docked ? 'is-docked' : ''} ${moduleCollapsed ? 'is-collapsed' : ''} ${className}`} data-workspace-block={item.id}
    style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: `${item.y + 1} / span ${item.h}` }}
    onDragOver={(event) => { if (!editing || !event.dataTransfer.types.includes(workspaceBlockMime)) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
    onDrop={(event) => { if (!editing) return; const sourceId = event.dataTransfer.getData(workspaceBlockMime) as WorkspaceBlockId; if (!sourceId) return; event.preventDefault(); event.stopPropagation(); onSwap(sourceId, item.id); }}>
    {editing && <><div className="workspace-block-editor"><button type="button" draggable aria-label={`Déplacer le bloc ${label}`} title="Glisser sur un autre bloc pour les permuter"
      onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData(workspaceBlockMime, item.id); }}><Move size={14} /><span>{label}</span></button><em>{docked ? 'Colonne gauche' : `${item.w} × ${item.h}`}</em></div>{!docked && <button type="button" className="workspace-resize-handle" onPointerDown={resize} aria-label={`Redimensionner le bloc ${label}`} title="Redimensionner sur la grille"><Maximize2 size={13} /></button>}</>}
    {collapsible && !editing && (moduleCollapsed
      ? <button type="button" className="workspace-module-collapsed-bar" aria-expanded="false" onClick={onToggleCollapsed} onDragOver={onCollapsedDragOver} onDrop={onCollapsedDrop}><span>{moduleIcon}<strong>{label}</strong>{moduleBadge !== undefined && <em>{moduleBadge}</em>}</span><ChevronDown size={13} /></button>
      : <button type="button" className="workspace-module-collapse-control" aria-label={`Réduire le module ${label}`} title="Réduire" onClick={onToggleCollapsed}><ChevronUp size={12} /></button>)}
    {!moduleCollapsed && <div className="workspace-block-content">{children}</div>}
  </section>;
}
