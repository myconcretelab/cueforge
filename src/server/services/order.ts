export function sameIds(received: string[], expected: string[]): boolean {
  return received.length === expected.length && new Set(received).size === received.length
    && received.every((id) => expected.includes(id));
}
