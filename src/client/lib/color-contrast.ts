export type ContrastColor = '#000000' | '#ffffff';

export function contrastColor(background: string): ContrastColor {
  const match = /^#([0-9a-f]{6})$/i.exec(background);
  if (!match) return '#ffffff';

  const channels = [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance > 0.179 ? '#000000' : '#ffffff';
}
