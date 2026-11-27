import { Box3, LOD, Mesh, Object3D, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { PieceRegistry } from "../../src/kit/registry";
import { createProductionRegistry } from "../../src/kit/pieces";
import { registerMarsPieces } from "../../src/kit/pieces/mars";
import { buildVehicleLOD, vehicleDetailLevels } from "../../src/kit/pieces/mars/rover-truck";
import { strandedStates } from "../../src/kit/pieces/mars/stranded-rover";
import { paletteUV } from "../../src/materials/atlas";
import { materials } from "../../src/materials/shared";
import { triangleCount } from "../../tools/geometry-inspection";
import { validatePiece } from "../../tools/validate-pieces";

function collectWheels(root: Object3D): Object3D[] {
  const wheels: Object3D[] = [];
  root.traverse(node => {
    if (node.userData?.wheel === true) wheels.push(node);
  });
  return wheels;
}

describe("T3.4 Mars exterior vehicles (MV-01, MV-11, and MV-03)", () => {
  const registry = new PieceRegistry();
  registerMarsPieces(registry);

  it("builds MV-01, MV-11 (stranded & rescued), and MV-03 with 3 descending LODs and LOD0 inside 3000..8000", () => {
    const specs: Array<{ id: string; params: Record<string, unknown> }> = [
      { id: "MV-01", params: {} },
      { id: "MV-11", params: { state: "stranded" } },
      { id: "MV-11", params: { state: "rescued" } },
      { id: "MV-03", params: {} },
    ];

    for (const { id, params } of specs) {
      const lod = buildVehicleLOD(registry, id, params);
      expect(lod).toBeInstanceOf(LOD);
      expect(lod.levels).toHaveLength(3);

      const [nearTris, midTris, farTris] = lod.levels.map(l => triangleCount(l.object));
      expect(nearTris, `${id} ${JSON.stringify(params)} LOD0 >= 3000`).toBeGreaterThanOrEqual(3000);
      expect(nearTris, `${id} ${JSON.stringify(params)} LOD0 <= 8000`).toBeLessThanOrEqual(8000);
      expect(nearTris).toBeGreaterThan(midTris);
      expect(midTris).toBeGreaterThan(farTris);

      const entry = registry.entries().find(e => e.id === id)!;
      for (const detail of vehicleDetailLevels) {
        const check = validatePiece(
          id,
          detail === "near" ? entry.metadata : { category: "terrain", pivot: "base-center" },
          () => registry.build(id, { ...params, detail }, true),
        );
        expect(check.issues, `${id}/${detail}/${JSON.stringify(params)}`).toEqual([]);
      }
    }

    expect(() => registry.build("MV-01", { detail: "ultra" })).toThrow();
    expect(() => registry.build("MV-11", { state: "broken" })).toThrow();
    expect(() => registry.build("MV-03", { detail: "ultra" })).toThrow();
  }, 20_000);

  it("rotates all child wheels on MV-01 (6), MV-11 (6), and MV-03 (4) around their local X axles without drift", () => {
    const builds: Array<{ obj: Object3D; expectedWheels: number }> = [
      ...vehicleDetailLevels.map(detail => ({ obj: registry.build("MV-01", { detail }, true), expectedWheels: 6 })),
      ...strandedStates.flatMap(state =>
        vehicleDetailLevels.map(detail => ({ obj: registry.build("MV-11", { state, detail }, true), expectedWheels: 6 })),
      ),
      ...vehicleDetailLevels.map(detail => ({ obj: registry.build("MV-03", { detail }, true), expectedWheels: 4 })),
    ];

    for (const { obj: vehicle, expectedWheels } of builds) {
      const wheels = collectWheels(vehicle);
      expect(wheels, vehicle.name).toHaveLength(expectedWheels);

      for (const wheel of wheels) {
        expect(wheel.userData.axis).toEqual([1, 0, 0]);
        vehicle.updateMatrixWorld(true);
        const before = new Box3().setFromObject(wheel).getCenter(new Vector3());
        const pivotWorld = wheel.getWorldPosition(new Vector3());
        expect(before.distanceTo(pivotWorld), `${vehicle.name}:${wheel.name} pivot`).toBeLessThan(0.001);

        wheel.rotation.x = Math.PI / 2;
        vehicle.updateMatrixWorld(true);
        const after = new Box3().setFromObject(wheel).getCenter(new Vector3());
        expect(after.distanceTo(before), `${vehicle.name}:${wheel.name} spin`).toBeLessThan(0.001);
      }
    }
  });

  it("uses exclusively M_palette with baked vertex AO and distinguishes MV-11 stranded vs rescued states", () => {
    const truck = registry.build("MV-01", { detail: "near" }, true);
    const stranded = registry.build("MV-11", { state: "stranded", detail: "near" }, true);
    const rescued = registry.build("MV-11", { state: "rescued", detail: "near" }, true);
    const buggy = registry.build("MV-03", { detail: "near" }, true);

    const yellowUv = paletteUV("yellow");
    const oxideUv = paletteUV("oxide");
    const warningUv = paletteUV("warning");
    const cyanUv = paletteUV("cyan");

    const countUv = (root: Object3D, targetUv: readonly [number, number]): number => {
      let matches = 0;
      root.traverse(node => {
        if (!(node instanceof Mesh)) return;
        expect(node.material).toBe(materials.M_palette);
        const uv = node.geometry.getAttribute("uv");
        for (let i = 0; i < uv.count; i++) {
          if (Math.abs(uv.getX(i) - targetUv[0]) < 1e-5 && Math.abs(uv.getY(i) - targetUv[1]) < 1e-5) {
            matches += 1;
          }
        }
      });
      return matches;
    };

    expect(countUv(truck, yellowUv)).toBe(0);
    expect(countUv(stranded, yellowUv)).toBe(0);
    expect(countUv(rescued, yellowUv)).toBe(0);
    expect(countUv(buggy, yellowUv)).toBe(0);
    expect(countUv(buggy, cyanUv)).toBeGreaterThan(40);

    // Stranded has smooth wheel dust drift + warning amber beacon and zero cyan lights or glued boulders
    expect(countUv(stranded, oxideUv)).toBeGreaterThan(40);
    expect(countUv(stranded, warningUv)).toBeGreaterThan(0);
    expect(countUv(stranded, cyanUv)).toBe(0);
    expect(stranded.getObjectByName("mv11-sand-trap")).toBeUndefined();
    expect(stranded.getObjectByName("mv11-wheel-dust-drift")).toBeDefined();
    expect(stranded.getObjectByName("stranded-amber-beacon")).toBeDefined();

    // Rescued is clean (zero oxide dust, zero amber warning) with bright cyan lights
    expect(countUv(rescued, oxideUv)).toBe(0);
    expect(countUv(rescued, warningUv)).toBe(0);
    expect(countUv(rescued, cyanUv)).toBeGreaterThan(40);
    expect(rescued.getObjectByName("rescued-cyan-beacon")).toBeDefined();

    // Stranded tilts ~7.2 deg sideways so front-right wheel sits > 0.22 m lower than front-left wheel
    stranded.updateMatrixWorld(true);
    const flY = stranded.getObjectByName("wheel_axle_fl")!.getWorldPosition(new Vector3()).y;
    const frY = stranded.getObjectByName("wheel_axle_fr")!.getWorldPosition(new Vector3()).y;
    expect(frY).toBeLessThan(flY - 0.22);
  });

  it("builds NX-01 outdoor 3-bay vehicle charging apron with 3 LODs, NW-03-A docks, bay decals, and clearance for MV-01, MV-03, and MV-11", () => {
    const prodReg = createProductionRegistry();
    const lod = buildVehicleLOD(prodReg, "NX-01", {}, [0, 38, 88]);
    expect(lod.levels).toHaveLength(3);
    const [nearTris, midTris, farTris] = lod.levels.map(l => triangleCount(l.object));
    expect(nearTris).toBeGreaterThanOrEqual(3000);
    expect(nearTris).toBeLessThanOrEqual(12000);
    expect(nearTris).toBeGreaterThan(midTris);
    expect(midTris).toBeGreaterThan(farTris);

    const entry = prodReg.entries().find(e => e.id === "NX-01")!;
    for (const detail of vehicleDetailLevels) {
      const check = validatePiece(
        "NX-01",
        detail === "near" ? entry.metadata : { category: "terrain", pivot: "base-center" },
        () => prodReg.build("NX-01", { detail }, true),
      );
      expect(check.issues, `NX-01/${detail}`).toEqual([]);
    }

    const apron = prodReg.build("NX-01", { detail: "near" }, true);
    const gSize = new Box3().setFromObject(apron).getSize(new Vector3());
    const mv01Size = new Box3().setFromObject(prodReg.build("MV-01")).getSize(new Vector3());
    const mv03Size = new Box3().setFromObject(prodReg.build("MV-03")).getSize(new Vector3());
    const mv11Size = new Box3().setFromObject(prodReg.build("MV-11", { state: "rescued" })).getSize(new Vector3());
    // Outdoor 3-bay charging apron accommodates all 3 vehicles side by side with open sky above (no shed roof!)
    expect(gSize.x).toBeGreaterThan(mv01Size.x + mv03Size.x + mv11Size.x + 4.0);
    expect(gSize.y).toBeLessThan(2.6);
    expect(gSize.z).toBeGreaterThan(mv01Size.z + 2.0);
    expect(apron.getObjectByName("nx01-apron-screens")).toBeDefined();
  });

  it("builds MB-14 slender illuminated entrance tower with 3 LODs, >22m height, and full-height glowing cyan vertical panels", () => {
    const lod = buildVehicleLOD(registry, "MB-14", {}, [0, 55, 130]);
    expect(lod.levels).toHaveLength(3);
    const [nearTris, midTris, farTris] = lod.levels.map(l => triangleCount(l.object));
    expect(nearTris).toBeGreaterThanOrEqual(3000);
    expect(nearTris).toBeLessThanOrEqual(12000);
    expect(nearTris).toBeGreaterThan(midTris);
    expect(midTris).toBeGreaterThan(farTris);

    const entry = registry.entries().find(e => e.id === "MB-14")!;
    for (const detail of vehicleDetailLevels) {
      const check = validatePiece(
        "MB-14",
        detail === "near" ? entry.metadata : { category: "terrain", pivot: "base-center" },
        () => registry.build("MB-14", { detail }, true),
      );
      expect(check.issues, `MB-14/${detail}`).toEqual([]);
    }

    const tower = registry.build("MB-14", { detail: "near" }, true);
    const tSize = new Box3().setFromObject(tower).getSize(new Vector3());
    expect(tSize.y).toBeGreaterThan(22.0);
    expect(tSize.x).toBeLessThan(7.2);

    const yellowUv = paletteUV("yellow");
    const cyanUv = paletteUV("cyan");
    let cyanMatches = 0;
    tower.traverse(node => {
      if (!(node instanceof Mesh)) return;
      expect(node.material).toBe(materials.M_palette);
      const uv = node.geometry.getAttribute("uv");
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i);
        const v = uv.getY(i);
        expect(Math.abs(u - yellowUv[0]) < 1e-5 && Math.abs(v - yellowUv[1]) < 1e-5).toBe(false);
        if (Math.abs(u - cyanUv[0]) < 1e-5 && Math.abs(v - cyanUv[1]) < 1e-5) cyanMatches += 1;
      }
    });
    // Full-height glowing cyan vertical panel bays yield > 1000 cyan vertices across the 4 facades
    expect(cyanMatches).toBeGreaterThan(1000);
  });

  it("builds MB-10 large depot, workshop, and skylight storage variants with 3 LODs inside 3000..12000", () => {
    for (const style of ["depot", "workshop", "skylight", "skylightOpen"] as const) {
      const lod = buildVehicleLOD(registry, "MB-10", { style }, [0, 38, 88]);
      const [nearTris, midTris, farTris] = lod.levels.map(l => triangleCount(l.object));
      expect(nearTris, `MB-10/${style}`).toBeGreaterThanOrEqual(3000);
      expect(nearTris, `MB-10/${style}`).toBeLessThanOrEqual(12000);
      expect(nearTris).toBeGreaterThan(midTris);
      expect(midTris).toBeGreaterThan(farTris);

      const entry = registry.entries().find(e => e.id === "MB-10")!;
      for (const detail of vehicleDetailLevels) {
        const check = validatePiece(
          "MB-10",
          detail === "near" ? entry.metadata : { category: "terrain", pivot: "base-center" },
          () => registry.build("MB-10", { style, detail }, true),
        );
        expect(check.issues, `MB-10/${style}/${detail}`).toEqual([]);
      }
    }
    const depotSize = new Box3().setFromObject(registry.build("MB-10", { style: "depot" })).getSize(new Vector3());
    expect(depotSize.x).toBeGreaterThan(15.0);
    expect(depotSize.z).toBeGreaterThan(11.0);
  });

  it("builds MB-13 stepped industrial 03 building with 3 LODs, vertex AO, and shared M_screen 03 decal", () => {
    const lod = buildVehicleLOD(registry, "MB-13", {}, [0, 45, 110]);
    const [nearTris, midTris, farTris] = lod.levels.map(l => triangleCount(l.object));
    expect(nearTris).toBeGreaterThanOrEqual(3000);
    expect(nearTris).toBeLessThanOrEqual(12000);
    expect(nearTris).toBeGreaterThan(midTris);
    expect(midTris).toBeGreaterThan(farTris);

    const entry = registry.entries().find(e => e.id === "MB-13")!;
    for (const detail of vehicleDetailLevels) {
      const check = validatePiece(
        "MB-13",
        detail === "near" ? entry.metadata : { category: "terrain", pivot: "base-center" },
        () => registry.build("MB-13", { detail }, true),
      );
      expect(check.issues, `MB-13/${detail}`).toEqual([]);
    }

    const near = registry.build("MB-13", { detail: "near" }, true);
    const size = new Box3().setFromObject(near).getSize(new Vector3());
    expect(size.y).toBeGreaterThan(15.0);
    const decalMesh = near.getObjectByName("mb13-decal-03") as Mesh | undefined;
    expect(decalMesh).toBeDefined();
    expect(decalMesh!.material).toBe(materials.M_screen);
  });
});
