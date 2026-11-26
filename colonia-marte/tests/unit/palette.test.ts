import { describe, expect, it } from "vitest";
import { Color, SRGBColorSpace } from "three";
import data from "../../palette.json";
import { loadPalette, palette, paletteHex } from "../../src/materials/palette";
import { atlas, ATLAS_SIZE, EMISSIVE_ROW, generateAtlas, paletteUV, TILE_SIZE } from "../../src/materials/atlas";

describe("measured palette document", () => {
  it("loads JSON with provenance and explicit design/science additions", () => {
    expect(loadPalette(data)).toEqual(palette);
    expect(palette.filter(color => color.source === "measured")).toHaveLength(25);
    for (const color of palette.filter(color => color.source === "measured")) {
      expect(color.observed.frame).toMatch(/^v[123]\/v[123]-t[\d.]+\.jpg$/);
      expect(color.observed.region).toHaveLength(4);
    }
    expect(paletteHex("growLight")).toBe("#FF5FD2");
    expect(paletteHex("leaf")).toBe("#5DBB4C");
    expect(paletteHex("leafDark")).toBe("#3E8E3A");
    expect(paletteHex("warning")).toBe("#FFB020");
    expect(paletteHex("doorOpen")).toBe("#3DFF8A");
    expect(paletteHex("doorClosed")).toBe("#FF4A4A");
    expect(paletteHex("skyZenith")).toBe("#D9A38A");
    expect(paletteHex("skyHorizon")).toBe("#F2CDB0");
    expect(paletteHex("sunHalo")).toBe("#DCE6EC");
    expect(paletteHex("cyan")).toBe("#3FD8FF");
    expect(paletteHex("oxide")).toBe("#734F4F");
    expect(paletteHex("regolithShade")).toBe("#4C3233");
    expect(palette.find(color => color.id === "oxide")?.baseReason).toContain("DV-06");
    expect(palette.find(color => color.id === "oxide")?.observed).toEqual({
      hex: "#3E232D", frame: "v3/v3-t054.60.jpg", region: [1040, 245, 80, 80],
    });
    expect(paletteHex("yellow")).toBe("#FFE08A");
    expect(palette.find(color => color.id === "cyan")?.observed).toEqual({
      hex: "#D3FDFC", frame: "v2/v2-t017.10.jpg", region: [1010, 1027, 45, 4],
    });
  });
  it("rejects invalid documents, duplicate IDs, missing regions and unknown colors", () => {
    expect(() => loadPalette(null)).toThrow();
    const document = (color: unknown) => ({ version: 2, colors: [color] });
    expect(() => loadPalette({ version: 2, colors: [data.colors[0], data.colors[0]] })).toThrow();
    expect(() => loadPalette(document({ ...data.colors[0], base: "lavender" }))).toThrow();
    expect(() => loadPalette(document({ ...data.colors[0], observed: null }))).toThrow();
    expect(() => loadPalette(document({
      ...data.colors[0], observed: { hex: "#D4D2C2", frame: "v2/v2-t017.10.jpg", region: null },
    }))).toThrow();
    expect(() => paletteHex("missing")).toThrow();
  });
  it("requires observed, base and a nonempty explanation in every JSON entry", () => {
    for (const color of data.colors) {
      expect(color).toHaveProperty("observed");
      expect(color).toHaveProperty("base");
      expect(color.baseReason.trim().length).toBeGreaterThan(0);
      for (const key of ["observed", "base", "baseReason"]) {
        const invalid: Record<string, unknown> = { ...color };
        delete invalid[key];
        expect(() => loadPalette({ version: 2, colors: [invalid] })).toThrow();
      }
    }
  });
  it("rejects washed-out emissive bases while preserving bloom observations", () => {
    for (const color of palette.filter(color => color.emissive)) {
      const hsl = new Color(color.base).getHSL({ h: 0, s: 0, l: 0 }, SRGBColorSpace);
      expect(hsl.s, color.id).toBeGreaterThanOrEqual(0.5);
      for (const base of ["#DDE0E0", "#F3F2EE", "#808080", "#FFFFFF", "#000000"]) {
        expect(() => loadPalette({ version: 2, colors: [{ ...color, base }] })).toThrow(/saturation/i);
      }
    }
  });
});

describe("palette raster and emission mask", () => {
  it("generates a deterministic 256x256 image with exactly one non-overlapping tile per color", () => {
    expect([atlas.width, atlas.height]).toEqual([256, 256]);
    expect(atlas.pixels).toHaveLength(256 * 256 * 4);
    expect(atlas.tiles).toHaveLength(palette.length);
    expect(new Set(atlas.tiles.map(tile => `${tile.x}:${tile.y}`)).size).toBe(palette.length);
    expect(generateAtlas().pixels).toEqual(atlas.pixels);
    for (const color of palette) {
      const tile = atlas.tiles.find(tile => tile.id === color.id)!;
      const rgb = [1, 3, 5].map(offset => parseInt(color.base.slice(offset, offset + 2), 16));
      for (let y = tile.y; y < tile.y + TILE_SIZE; y++) {
        for (let x = tile.x; x < tile.x + TILE_SIZE; x++) {
          const offset = (y * ATLAS_SIZE + x) * 4;
          expect(Array.from(atlas.pixels.slice(offset, offset + 4))).toEqual([...rgb, 255]);
          expect(Array.from(atlas.emission.slice(offset, offset + 4)))
            .toEqual([...(color.emissive ? rgb : [0, 0, 0]), 255]);
        }
      }
      expect(tile.y === EMISSIVE_ROW * TILE_SIZE).toBe(color.emissive);
    }
  });
  it("rasterizes base instead of the measured bloom center", () => {
    const cyan = atlas.tiles.find(tile => tile.id === "cyan")!;
    const offset = (cyan.y * ATLAS_SIZE + cyan.x) * 4;
    expect(Array.from(atlas.pixels.slice(offset, offset + 4))).toEqual([63, 216, 255, 255]);
    expect(Array.from(atlas.emission.slice(offset, offset + 4))).toEqual([63, 216, 255, 255]);
  });
  it("fails on overflowing rows or duplicate colors", () => {
    const color = palette[0];
    expect(() => generateAtlas([color, color])).toThrow();
    const colors = Array.from({ length: 9 }, (_, index) => ({ ...color, id: `led${index}`, emissive: true }));
    expect(() => generateAtlas(colors)).toThrow("capacity");
    expect(() => paletteUV("missing")).toThrow();
  });
});
