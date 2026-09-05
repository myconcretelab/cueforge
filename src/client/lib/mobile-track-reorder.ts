export interface ClientPoint {
  clientX: number;
  clientY: number;
}

export function mobileTrackDragActivated(start: ClientPoint, current: ClientPoint, threshold = 8): boolean {
  return Math.hypot(current.clientX - start.clientX, current.clientY - start.clientY) >= threshold;
}

export function mobileTrackAutoScrollDelta(clientY: number, viewportHeight: number, edgeSize = 84, maximumSpeed = 22): number {
  if (viewportHeight <= 0 || edgeSize <= 0 || maximumSpeed <= 0) return 0;
  const edge = Math.min(edgeSize, viewportHeight / 2);
  if (clientY < edge) return -Math.ceil(maximumSpeed * Math.min(1, (edge - Math.max(0, clientY)) / edge));
  if (clientY > viewportHeight - edge) return Math.ceil(maximumSpeed * Math.min(1, (Math.min(viewportHeight, clientY) - (viewportHeight - edge)) / edge));
  return 0;
}
