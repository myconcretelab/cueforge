export interface SelectionRectangle {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface ElementBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function intersectsSelection(bounds: ElementBounds, selection: SelectionRectangle): boolean {
  const left = Math.min(selection.startX, selection.currentX);
  const right = Math.max(selection.startX, selection.currentX);
  const top = Math.min(selection.startY, selection.currentY);
  const bottom = Math.max(selection.startY, selection.currentY);
  return bounds.right >= left && bounds.left <= right && bounds.bottom >= top && bounds.top <= bottom;
}
