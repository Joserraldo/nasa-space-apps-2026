import { describe, expect, it } from "vitest";
import { BoxGeometry, Float32BufferAttribute, Mesh, PlaneGeometry } from "three";
import { chamferBox, ledStrip } from "../../src/kit/primitives";
import { coloredGeometry } from "../../src/materials/uv";
import { paletteUV, atlas, ATLAS_SIZE, TILE_SIZE } from "../../src/materials/atlas";
import { materials, paletteMap, emissiveMap, sharedMaterials } from "../../src/materials/shared";
import { previewGlow, previewOpaque } from "../../src/materials/preview";
import { screenGeometry, screenTypes } from "../../src/materials/screens";
import { createDemoRegistry } from "../../src/core/demo-pieces";
import { validatePiece } from "../../tools/validate-pieces";

describe("atlas UV and shared material boundary", () => {
  it("replaces stale AO with white and welds only after assigning constant UVs", () => {
    const source = new BoxGeometry().toNonIndexed();
    source.setAttribute("color", new Float32BufferAttribute(
      new Float32Array(source.getAttribute("position").count * 3).fill(0.2), 3,
    ));
    const plain = coloredGeometry(source, "white");
    const welded = coloredGeometry(source, "white", { weld: true });
    expect(welded.getAttribute("position").count).toBe(24);
    expect(plain.getAttribute("position").count).toBe(36);
    expect(welded.index!.count).toBe(36);
    expect(coloredGeometry(source, "white", { weld: true })).toBe(welded);
    expect(coloredGeometry(source, "red", { weld: true })).not.toBe(welded);
    expect(Array.from(welded.getAttribute("color").array).every(value => value === 1)).toBe(true);
    expect(source.getAttribute("color").getX(0)).toBeCloseTo(0.2);
    expect(new Set(Array.from(welded.getAttribute("normal").array))).toEqual(new Set([0, 1, -1]));
  });
  it("maps every vertex to its tile center without modifying cached source geometry", () => {
    const source = chamferBox(1, 1, 1, 0.04);
    const original = Array.from(source.getAttribute("uv").array);
    for (const tile of atlas.tiles) {
      const result = coloredGeometry(source, tile.id);
      const uv = result.getAttribute("uv");
      const expected = paletteUV(tile.id);
      expect(coloredGeometry(source, tile.id)).toBe(result);
      for (let index = 0; index < uv.count; index++) {
        expect(uv.getX(index)).toBe(expected[0]);
        expect(uv.getY(index)).toBe(expected[1]);
        expect(uv.getX(index) * ATLAS_SIZE).toBeGreaterThan(tile.x);
        expect(uv.getX(index) * ATLAS_SIZE).toBeLessThan(tile.x + TILE_SIZE);
        expect((1 - uv.getY(index)) * ATLAS_SIZE).toBe(tile.y + TILE_SIZE / 2);
      }
    }
    expect(Array.from(source.getAttribute("uv").array)).toEqual(original);
    expect(ledStrip().getAttribute("uv").getY(0)).toBe(paletteUV("cyan")[1]);
    expect(() => coloredGeometry(source, "missing")).toThrow();
  });
  it("shares one atlas material for solid emission and one additive Hall plume material", () => {
    expect(Object.keys(materials)).toEqual([
      "M_palette", "M_glass", "M_sky", "M_terrain", "M_hologram", "M_screen", "M_hallPlume",
    ]);
    expect(sharedMaterials.size).toBe(7);
    expect(previewOpaque).toBe(materials.M_palette);
    expect(previewGlow).toBe(materials.M_palette);
    expect(materials.M_palette.map).toBe(paletteMap);
    expect(materials.M_palette.emissiveMap).toBe(emissiveMap);
    expect(paletteMap.image.width).toBe(256);
    expect(emissiveMap.image.height).toBe(256);
  });
  it("uses the canonical daylight endpoints and a separate pale solar halo", () => {
    const { uniforms } = materials.M_sky;
    expect(uniforms.zenith.value.getHexString()).toBe("d9a38a");
    expect(uniforms.horizon.value.getHexString()).toBe("f2cdb0");
    expect(uniforms.sunHalo.value.getHexString()).toBe("dce6ec");
    expect(uniforms.stars.value).toBe(0);
  });
  it("every fresh registered variant uses provider identities and never a private material", () => {
    const registry = createDemoRegistry();
    for (const entry of registry.entries()) {
      for (const params of Object.values(entry.variants)) {
        registry.build(entry.id, params, true).traverse(node => {
          if (!(node instanceof Mesh)) return;
          const list = Array.isArray(node.material) ? node.material : [node.material];
          list.forEach(material => expect(sharedMaterials.has(material)).toBe(true));
        });
      }
    }
    const definition = registry.entries().find(entry => entry.id === "DN-01")!;
    const result = validatePiece(definition.id, definition.metadata, () => {
      const root = registry.build(definition.id, {}, true);
      const mesh = root.children[0] as Mesh;
      mesh.material = materials.M_palette.clone();
      return root;
    });
    expect(result.issues.map(issue => issue.check)).toContain("materials");
  });
});

describe("screen atlas coordinates", () => {
  it("allocates eight distinct rectangles with half-texel gutters on the same texture", () => {
    const centers = new Set<string>();
    const plane = new PlaneGeometry();
    const original = Array.from(plane.getAttribute("uv").array);
    for (const type of screenTypes) {
      const uv = screenGeometry(plane, type).getAttribute("uv");
      const values = Array.from(uv.array);
      expect(values.every(value => value > 0 && value < 1)).toBe(true);
      centers.add(`${uv.getX(0)},${uv.getY(0)}`);
    }
    expect(centers.size).toBe(8);
    expect(Array.from(plane.getAttribute("uv").array)).toEqual(original);
  });
});
