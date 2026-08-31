export function playlistRowsAreValid(items: Array<{ rowIndex: number }>, maxGroupSize: number): boolean {
  const rowCounts = new Map<number, number>();
  for (const item of items) rowCounts.set(item.rowIndex, (rowCounts.get(item.rowIndex) ?? 0) + 1);
  const rowIndexes = [...rowCounts.keys()].sort((first, second) => first - second);
  return rowIndexes.every((rowIndex, index) => rowIndex === index)
    && [...rowCounts.values()].every((count) => count <= maxGroupSize);
}
