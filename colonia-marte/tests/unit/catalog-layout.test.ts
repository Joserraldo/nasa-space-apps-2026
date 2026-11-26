import { describe, expect, it } from "vitest";
import { Box3, Group, Mesh, PerspectiveCamera, Vector3 } from "three";
import { primitiveSamples } from "../../src/catalog/samples";
import {
  arrangePage, arrangeSheet, buildRoomFromLayout, fitSheetCamera, parseRoomLayout,
} from "../../src/catalog/layout";
import canteenJson from "../../data/layouts/rooms/canteen.json";
import nw01Json from "../../data/layouts/rooms/nw-01.json";
import nw02Json from "../../data/layouts/rooms/nw-02.json";
import nw05Json from "../../data/layouts/rooms/nw-05.json";
import nw13Json from "../../data/layouts/rooms/nw-13.json";
import nw14Json from "../../data/layouts/rooms/nw-14.json";
import nw15Json from "../../data/layouts/rooms/nw-15.json";
import nw16Json from "../../data/layouts/rooms/nw-16.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { catalogPage } from "../../src/catalog/pagination";
import { createDemoRegistry } from "../../src/core/demo-pieces";
import { materials } from "../../src/materials/shared";

function projectedBox(bounds: Box3, camera: PerspectiveCamera, width: number, height: number) {
  const corners: Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z).project(camera));
    }
  }
  return {
    left: Math.min(...corners.map(point => (point.x + 1) * width / 2)),
    right: Math.max(...corners.map(point => (point.x + 1) * width / 2)),
    top: Math.min(...corners.map(point => (1 - point.y) * height / 2)),
    bottom: Math.max(...corners.map(point => (1 - point.y) * height / 2)),
  };
}

describe("catalog at 1280x720", () => {
  it("frames only the visible page, even when a distant huge object is on another page", () => {
    const group = new Group();
    const entries = Array.from({ length: 25 }, (_, i) => {
      const object = new Mesh(primitiveSamples.chamferBox(), materials.M_palette);
      if (i === 24) { object.scale.setScalar(1000); object.position.x = 1e6; }
      group.add(object);
      return { label: `ST-W01 / v${i}`, object, anchor: new Vector3() };
    });
    const first = catalogPage(entries, "All", 0).items;
    const bounds = arrangePage(group, first);
    const camera = new PerspectiveCamera(48, 1000 / 568, 0.05, 150);
    fitSheetCamera(camera, bounds);
    expect(group.children).toHaveLength(12);
    expect(group.children).not.toContain(entries[24].object);
    expect(camera.position.z).toBeLessThan(30);
    first.forEach(entry => {
      const box = projectedBox(new Box3().setFromObject(entry.object), camera, 1000, 568);
      expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(1000);
      expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(568);
    });
  });
  it("fits every rotated object and its label separately, without overlap", () => {
    const registry = createDemoRegistry();
    const objects = Object.values(primitiveSamples).map(build => new Mesh(build(), materials.M_palette));
    const pieces = registry.entries().flatMap(entry => Object.values(entry.variants)
      .map(params => registry.build(entry.id, params)));
    const group = new Group();
    const entries = [...objects, ...pieces].map(candidate => {
      const object = new Group();
      object.add(candidate);
      object.rotation.set(0.32, -0.45, 0);
      group.add(object);
      return { object, anchor: new Vector3() };
    });
    arrangeSheet(entries, 4);
    const bounds = new Box3().setFromObject(group);
    entries.forEach(entry => bounds.expandByPoint(entry.anchor));
    const width = 1000;
    const height = 568;
    const camera = new PerspectiveCamera(48, width / height, 0.05, 150);
    fitSheetCamera(camera, bounds);
    const rectangles = entries.flatMap(entry => {
      const object = projectedBox(new Box3().setFromObject(entry.object), camera, width, height);
      const anchor = entry.anchor.clone().project(camera);
      const x = (anchor.x + 1) * width / 2;
      const y = (1 - anchor.y) * height / 2;
      const label = { left: x - 104, right: x + 104, top: y, bottom: y + 24 };
      expect(label.top).toBeGreaterThan(object.bottom);
      return [object, label];
    });
    for (const [index, a] of rectangles.entries()) {
      expect(a.left).toBeGreaterThanOrEqual(0);
      expect(a.right).toBeLessThanOrEqual(width);
      expect(a.top).toBeGreaterThanOrEqual(0);
      expect(a.bottom).toBeLessThanOrEqual(height);
      for (const b of rectangles.slice(index + 1)) {
        const overlap = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        expect(overlap, `rectangle ${index} ${JSON.stringify(a)} vs ${JSON.stringify(b)}`).toBe(false);
      }
    }
  });
});

describe("room layout schema and canteen pilot layout (T5.1)", () => {
  it("validates and builds data/layouts/rooms/canteen.json with production pieces", () => {
    const registry = createProductionRegistry();
    const layout = parseRoomLayout(canteenJson, registry);
    expect(layout.id).toBe("canteen");
    expect(layout.environment).toBe("AMB-02");
    expect(layout.views).toHaveLength(2);
    const built = buildRoomFromLayout(layout, registry);
    expect(built.pieceCount).toBeGreaterThan(80);
    expect(built.lightsGroup.children.length).toBe(layout.lights.length);

    const airlock = parseRoomLayout(nw05Json, registry);
    expect(airlock.id).toBe("nw-05");
    expect(buildRoomFromLayout(airlock, registry).pieceCount).toBeGreaterThan(40);

    const servers = parseRoomLayout(nw01Json, registry);
    expect(servers.id).toBe("nw-01");
    expect(buildRoomFromLayout(servers, registry).pieceCount).toBeGreaterThan(70);

    const greenhouse = parseRoomLayout(nw02Json, registry);
    expect(greenhouse.id).toBe("nw-02");
    expect(buildRoomFromLayout(greenhouse, registry).pieceCount).toBeGreaterThan(95);

    const comms = parseRoomLayout(nw13Json, registry);
    expect(comms.id).toBe("nw-13");
    expect(buildRoomFromLayout(comms, registry).pieceCount).toBeGreaterThan(60);

    const shelter = parseRoomLayout(nw14Json, registry);
    expect(shelter.id).toBe("nw-14");
    expect(shelter.environment).toBe("AMB-03");
    expect(buildRoomFromLayout(shelter, registry).pieceCount).toBeGreaterThan(50);

    const bridge = parseRoomLayout(nw15Json, registry);
    expect(bridge.id).toBe("nw-15");
    expect(buildRoomFromLayout(bridge, registry).pieceCount).toBeGreaterThan(65);

    const common = parseRoomLayout(nw16Json, registry);
    expect(common.id).toBe("nw-16");
    expect(buildRoomFromLayout(common, registry).pieceCount).toBeGreaterThan(65);
  });

  it("rejects unknown or unregistered piece IDs and invalid parameters", () => {
    const registry = createProductionRegistry();
    expect(() => parseRoomLayout({
      ...canteenJson,
      pieces: [{ id: "INVALID-99", position: [2, 0, 2] }],
    }, registry)).toThrow(/Invalid inventory piece ID/);

    expect(() => parseRoomLayout({
      ...canteenJson,
      walls: {
        ...canteenJson.walls,
        north: [{ id: "BOGUS-WALL" }, ...canteenJson.walls.north.slice(1)],
      },
    }, registry)).toThrow(/Invalid inventory piece ID/);

    expect(() => parseRoomLayout({
      ...canteenJson,
      pieces: [{ id: "GY-01", position: [2, 0, 2] }],
    }, registry)).toThrow(/Unregistered piece ID/);

    expect(() => parseRoomLayout({
      ...canteenJson,
      pieces: [{ id: "DN-04", position: [2, 0, 2], params: { screen: "pizza" } }],
    }, registry)).toThrow(/Invalid option/);
  });
});
