import { describe, expect, it } from "vitest";
import { Color, InstancedMesh, LOD, Matrix4, Mesh, SRGBColorSpace, Vector3 } from "three";
import { createProductionRegistry } from "../../src/kit/pieces";
import { paletteUV } from "../../src/materials/atlas";
import { paletteHex } from "../../src/materials/palette";
import { materials } from "../../src/materials/shared";
import { createSpaceShot, SPACE_DURATION } from "../../src/scenes/space-shot";
import { triangleCount } from "../../tools/geometry-inspection";

describe("the transit intro shot", () => {
  it("uses registered parts and retains three descending ship detail levels", () => {
    const registry = createProductionRegistry();
    const { ship, earth, preset } = createSpaceShot(registry, 16 / 9);
    expect(preset.id).toBe("AMB-01");
    expect(ship).toBeInstanceOf(LOD);
    expect(ship.levels.map(level => level.object.userData.pieceId)).toEqual(["MV-09", "MV-09", "MV-09"]);
    expect(earth.userData.pieceId).toBe("BG-01");
    const [near, middle, far] = ship.levels.map(level => triangleCount(level.object));
    expect(near).toBeGreaterThanOrEqual(3000);
    expect(near).toBeLessThanOrEqual(25000);
    expect(middle).toBeLessThanOrEqual(10000);
    expect(far).toBeLessThanOrEqual(3500);
    expect(near).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(far);
    expect(() => registry.build("MV-09", { detail: "invalid" })).toThrow("Invalid option");
  });

  it("keeps Orion's four three-panel wings and two larger DST wings with no rotating habitat at every LOD", () => {
    const { ship } = createSpaceShot(createProductionRegistry(), 16 / 9);
    for (const { object } of ship.levels) {
      const orion = object.getObjectByName("orion-service-module");
      const propulsion = object.getObjectByName("dst-electric-propulsion");
      const orionWings = orion?.children.filter(part => part.name.startsWith("orion-solar-wing-"));
      const dstWings = propulsion?.children.filter(part => part.name.startsWith("dst-solar-wing-"));
      expect(orionWings).toHaveLength(4);
      expect(dstWings).toHaveLength(2);
      for (const wing of orionWings!) expect(wing.children.filter(part => part.name.startsWith("orion-panel-"))).toHaveLength(3);
      object.traverse(part => {
        expect(part.name).not.toMatch(/habitation-ring|rotating-ring/i);
        if (part instanceof Mesh) expect(part.geometry.type).not.toBe("TorusGeometry");
      });
    }
  });

  it("instances four hollow emissive Hall channels in the blue xenon range at every LOD", () => {
    const hue = new Color(paletteHex("xenonGlow")).getHSL({ h: 0, s: 0, l: 0 }, SRGBColorSpace).h * 360;
    expect(hue).toBeGreaterThanOrEqual(200);
    expect(hue).toBeLessThanOrEqual(230);
    const { ship } = createSpaceShot(createProductionRegistry(), 16 / 9);
    for (const { object } of ship.levels) {
      const channels = object.getObjectByName("hall-emissive-channels") as InstancedMesh;
      expect(channels).toBeInstanceOf(InstancedMesh);
      expect(channels.count).toBe(4);
      expect(channels.material).toBe(materials.M_palette);
      const position = channels.geometry.getAttribute("position");
      const uv = channels.geometry.getAttribute("uv");
      const [u, v] = paletteUV("xenonGlow");
      for (let i = 0; i < position.count; i++) {
        expect(Math.hypot(position.getY(i), position.getZ(i))).toBeGreaterThan(0.25);
        expect(uv.getX(i)).toBe(u);
        expect(uv.getY(i)).toBe(v);
      }
      const plumes = object.getObjectByName("hall-plumes") as InstancedMesh;
      expect(plumes.count).toBe(4);
      expect(plumes.material).toMatchObject({ transparent: true, depthWrite: false });
    }
  });

  it("bakes contact occlusion into opaque habitat vertices and blinks the two nav lights", () => {
    const { ship, pose } = createSpaceShot(createProductionRegistry(), 16 / 9);
    const model = ship.levels[0].object;
    const habitat = model.getObjectByName("dst-transit-habitat")!;
    const hull = habitat.children.find(part => part instanceof Mesh && !(part instanceof InstancedMesh)) as Mesh;
    const colors = hull.geometry.getAttribute("color");
    expect(colors.array.some(value => value < 0.88)).toBe(true);
    expect(colors.array.some(value => value === 1)).toBe(true);
    for (const color of ["red", "green"]) {
      const nav = model.getObjectByName(`nav-${color}`)!;
      pose(0.8);
      expect(nav.visible).toBe(true);
      pose(1.75);
      expect(nav.visible).toBe(false);
    }
  });

  it("keeps a recognizable Earth in frame while the ship recedes", () => {
    const { camera, ship, earth, earthCenter, pose } = createSpaceShot(createProductionRegistry(), 16 / 9);
    pose(0);
    const startDistance = camera.position.distanceTo(ship.position);
    const earthScreen = earthCenter.clone().project(camera);
    expect(Math.abs(earthScreen.x)).toBeLessThan(0.9);
    expect(earthScreen.y).toBeGreaterThan(0.3);
    const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const edge = earthCenter.clone().addScaledVector(up, earth.scale.x).project(camera);
    expect((edge.y - earthScreen.y) * 720).toBeGreaterThanOrEqual(48);
    pose(SPACE_DURATION);
    expect(camera.position.distanceTo(ship.position)).toBeGreaterThan(startDistance * 1.18);
    ship.update(camera);
    expect(ship.getCurrentLevel()).toBe(2);
    expect(earthCenter.clone().project(camera).x).toBeGreaterThan(-0.9);
  });

  it("keeps the silhouette between 30% and 40% of the frame through departure", () => {
    const { camera, ship, pose } = createSpaceShot(createProductionRegistry(), 16 / 9);
    const vertex = new Vector3();
    const transform = new Matrix4();
    for (const time of [0, 0.8, 1.5, 3, 4.5, SPACE_DURATION]) {
      pose(time);
      ship.update(camera);
      let left = Infinity, right = -Infinity;
      ship.traverseVisible(node => {
        if (!(node instanceof Mesh)) return;
        const vertices = node.geometry.getAttribute("position");
        for (let i = 0; i < (node instanceof InstancedMesh ? node.count : 1); i++) {
          transform.identity();
          if (node instanceof InstancedMesh) node.getMatrixAt(i, transform);
          transform.premultiply(node.matrixWorld);
          for (let j = 0; j < vertices.count; j++) {
            const x = vertex.fromBufferAttribute(vertices, j).applyMatrix4(transform).project(camera).x;
            left = Math.min(x, left);
            right = Math.max(x, right);
          }
        }
      });
      expect((right - left) / 2, `frame at ${time} s`).toBeGreaterThanOrEqual(0.30);
      expect((right - left) / 2, `frame at ${time} s`).toBeLessThanOrEqual(0.40);
    }
  });

  it("moves away from Earth without rotating the solar wings relative to the ship", () => {
    const { camera, ship, earthCenter, pose } = createSpaceShot(createProductionRegistry(), 16 / 9);
    const wing = ship.levels[0].object.getObjectByName("dst-solar-wing-1")!;
    const screenGap = () => ship.position.clone().project(camera).x - earthCenter.clone().project(camera).x;
    pose(0);
    const start = screenGap();
    const startRotation = wing.quaternion.clone();
    pose(SPACE_DURATION / 2);
    expect(screenGap()).toBeGreaterThan(start);
    expect(wing.quaternion.equals(startRotation)).toBe(true);
  });
});
