import { palette, type PaletteColor } from "./palette";

export const ATLAS_SIZE = 256;
export const TILE_SIZE = 32;
export const ATLAS_COLUMNS = ATLAS_SIZE / TILE_SIZE;
export const EMISSIVE_ROW = ATLAS_COLUMNS - 1;
export interface PaletteTile { id: string; x: number; y: number; emissive: boolean }

/** Top-left image coordinates. The bottom row is reserved exclusively for emissive colors. */
export function generateAtlas(colors: readonly PaletteColor[] = palette) {
  const pixels = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
  const emission = new Uint8Array(pixels.length);
  const tiles: PaletteTile[] = [];
  let opaque = 0;
  let emissive = 0;
  for (const color of colors) {
    if (tiles.some(tile => tile.id === color.id)) throw new Error(`Duplicate atlas color: ${color.id}`);
    const index = color.emissive ? emissive++ : opaque++;
    if (emissive > ATLAS_COLUMNS || opaque > EMISSIVE_ROW * ATLAS_COLUMNS) {
      throw new Error("Palette exceeds atlas capacity");
    }
    const x = index % ATLAS_COLUMNS * TILE_SIZE;
    const y = (color.emissive ? EMISSIVE_ROW : Math.floor(index / ATLAS_COLUMNS)) * TILE_SIZE;
    const rgb = [1, 3, 5].map(offset => parseInt(color.base.slice(offset, offset + 2), 16));
    tiles.push({ id: color.id, x, y, emissive: color.emissive });
    for (let row = y; row < y + TILE_SIZE; row++) {
      for (let col = x; col < x + TILE_SIZE; col++) {
        const offset = (row * ATLAS_SIZE + col) * 4;
        pixels.set([...rgb, 255], offset);
        emission.set([...(color.emissive ? rgb : [0, 0, 0]), 255], offset);
      }
    }
  }
  return { width: ATLAS_SIZE, height: ATLAS_SIZE, pixels, emission, tiles };
}

export const atlas = generateAtlas();

export function paletteUV(id: string): [number, number] {
  const tile = atlas.tiles.find(candidate => candidate.id === id);
  if (!tile) throw new Error(`Unknown palette color: ${id}`);
  return [(tile.x + TILE_SIZE / 2) / ATLAS_SIZE, 1 - (tile.y + TILE_SIZE / 2) / ATLAS_SIZE];
}
