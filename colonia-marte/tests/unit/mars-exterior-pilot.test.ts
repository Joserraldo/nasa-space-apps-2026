import { BatchedMesh, InstancedMesh, LOD, Mesh, PerspectiveCamera, PlaneGeometry } from "three";
import { describe, expect, it } from "vitest";
import colonyJson from "../../data/layouts/colonies/exterior-pilot.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { registerMarsPieces } from "../../src/kit/pieces/mars";
import { PieceRegistry } from "../../src/kit/registry";
import { drawDecalSticker } from "../../src/materials/decal-stickers";
import { decalScreenGeometry, decalTypes, SCREEN_HEIGHT, SCREEN_WIDTH } from "../../src/materials/screens";
import { materials } from "../../src/materials/shared";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/exterior-pilot";
import { countColonyTriangles } from "../../src/scenes/colony-batches";
import { validateRegistry } from "../../tools/validate-pieces";

const requiredIds = [
  "MB-01", "MB-02", "MB-03", "MB-04", "MB-07", "MB-10",
  "MI-03", "MI-04", "MI-06", "MI-09", "MI-11",
] as const;

describe("T3.1 Mars colony exterior pilot pieces, decals, and layout", () => {
  it("fuses the dome per material at each of its three distance levels", () => {
    const registry = createProductionRegistry();
    const colony = buildColonyGroup(parseColonyLayout(colonyJson, registry), registry);
    const batches = colony.children.filter(child => child instanceof BatchedMesh);
    const buildings = colony.children.filter(child => child instanceof LOD);

    expect(batches).toHaveLength(0);
    const dome = buildings.find(building => building.name.startsWith("MB-04"))!;
    expect(dome.levels).toHaveLength(3);
    for (const { object } of dome.levels) {
      const meshes = object.children.filter(child => child instanceof Mesh);
      expect(meshes.filter(mesh => mesh.material === materials.M_palette)).toHaveLength(1);
    }
    const camera = new PerspectiveCamera();
    camera.position.copy(dome.position);
    camera.updateMatrixWorld();
    colony.updateMatrixWorld();
    expect(colony.updateLods(camera)).toBe(false);
    expect(dome.getCurrentLevel()).toBe(0);
    camera.position.z += 200;
    camera.updateMatrixWorld();
    expect(colony.updateLods(camera)).toBe(true);
    expect(dome.getCurrentLevel()).toBe(2);
    expect(dome.levels[2].object.children.some(child => child instanceof Mesh &&
      child.material === materials.M_glass)).toBe(true);
    expect(colony.updateLods(camera)).toBe(false);
  });

  it("uses shared capsule frames and panes while retaining the full near triangle count", () => {
    const registry = createProductionRegistry();
    const colony = buildColonyGroup(parseColonyLayout(colonyJson, registry), registry);
    const capsules = colony.children.find(child => child instanceof LOD && child.name.startsWith("MB-01")) as LOD;
    expect(capsules.levels[0].object.children.some(child =>
      child instanceof InstancedMesh && child.count === 4 && child.material === materials.M_glass)).toBe(true);
    expect(colony.detailedTriangles).toBe(76404 + countColonyTriangles(registry.build("MI-07")));
  });

  it("registers all 11 exterior pieces and passes specification 8.1 checks", () => {
    const registry = new PieceRegistry();
    registerMarsPieces(registry);
    for (const id of requiredIds) {
      expect(registry.ids()).toContain(id);
    }
    const results = validateRegistry(registry).filter(r =>
      (requiredIds as readonly string[]).includes(r.id),
    );
    expect(results.length).toBeGreaterThanOrEqual(22);
    for (const result of results) {
      expect(result.issues, `${result.id}/${result.variant}`).toEqual([]);
    }
  });

  it("maps distinct atlas regions for all realistic aerospace decal stickers on shared M_screen", () => {
    const plane = new PlaneGeometry(1, 0.6);
    const centers = new Set<string>();
    for (const decal of decalTypes) {
      const uv = decalScreenGeometry(plane, decal).getAttribute("uv");
      const coords = Array.from(uv.array);
      expect(coords.every(v => v > 0 && v < 1)).toBe(true);
      centers.add(`${uv.getX(0).toFixed(5)},${uv.getY(0).toFixed(5)}`);
    }
    plane.dispose();
    expect(centers.size).toBe(decalTypes.length);

    // Every fitted text call must stay inside the inner decal border (x + maxWidth <= w - 24)
    for (const decal of decalTypes) {
      const textSpans: Array<{ text: string; x: number; maxWidth?: number }> = [];
      const mockCtx = {
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        font: "12px monospace",
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        ellipse: () => {},
        rect: () => {},
        clip: () => {},
        fill: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        measureText: (t: string) => ({ width: t.length * 8.5 }),
        fillText: (text: string, x: number, _y: number, maxWidth?: number) => {
          textSpans.push({ text, x, maxWidth });
        },
      } as unknown as CanvasRenderingContext2D;
      drawDecalSticker(mockCtx, decal, SCREEN_WIDTH, SCREEN_HEIGHT);
      expect(textSpans.length).toBeGreaterThan(1);
      for (const span of textSpans) {
        if (span.text === "!") continue;
        expect(span.maxWidth, `${decal}: "${span.text}" must enforce maxWidth`).toBeDefined();
        expect(span.x + (span.maxWidth ?? 0), `${decal}: "${span.text}" right bound`).toBeLessThanOrEqual(SCREEN_WIDTH - 24);
      }
    }
  });

  it("validates and batches data/layouts/colonies/exterior-pilot.json with shared M_screen decals", () => {
    const registry = createProductionRegistry();
    const layout = parseColonyLayout(colonyJson, registry);
    expect(layout.biome).toBe("jezero");
    expect(layout.environment).toBe("AMB-04");
    for (const id of requiredIds) {
      expect(layout.placements.some(p => p.id === id)).toBe(true);
    }
    expect(layout.placements.filter(p => p.id === "MB-01")).toHaveLength(4);
    expect(layout.placements.filter(p => p.id === "MB-10")).toHaveLength(2);

    const batched = buildColonyGroup(layout, registry);
    expect(batched.children.length).toBeGreaterThan(0);
    let hasScreenDecals = false;
    batched.traverse(node => {
      if (node instanceof Mesh && node.material === materials.M_screen) hasScreenDecals = true;
    });
    expect(hasScreenDecals).toBe(true);

    expect(() => parseColonyLayout({
      ...colonyJson,
      placements: [{ id: "FAKE-99", at: [0, 0] }],
    }, registry)).toThrow(/Invalid inventory piece ID/);
  });
});
