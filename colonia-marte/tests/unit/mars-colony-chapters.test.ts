import { describe, expect, it } from "vitest";
import { Raycaster, Vector3 } from "three";
import pilot from "../../data/layouts/colonies/exterior-pilot.json";
import district from "../../data/layouts/colonies/base-district.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { loadColonyChapter } from "../../src/scenes/colony-chapters";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";
import { composeColonyLayout } from "../../src/scenes/colony-district";
import { selectColonyEnvironment } from "../../src/scenes/colony-environment";
import { createFamilyArrival } from "../../src/scenes/colony-arrival";
import { LANDING_PAD_DECK_HEIGHT } from "../../src/kit/pieces/mars/landing-pad";

const chapters = ["c2", "c3", "c4", "c5", "final"] as const;

describe("Colony chapter progression", () => {
  it("validates against the registry and adds placements without moving the earlier ones", async () => {
    const registry = createProductionRegistry();
    const layouts = await Promise.all(chapters.map(async chapter =>
      parseColonyLayout(await loadColonyChapter(new URLSearchParams({ chapter })), registry),
    ));
    expect(layouts.map(layout => layout.id)).toEqual(["c2-inicio", "c3", "c4", "c5", "final"]);
    for (const [previous, next] of layouts.slice(1).map((next, i) => [layouts[i], next])) {
      expect(next.placements.length).toBeGreaterThan(previous.placements.length);
      expect(next.placements).toEqual(expect.arrayContaining(previous.placements));
    }
    const [c2, c3, c4, c5, final] = layouts;
    expect(c2.placements.filter(part => part.id.startsWith("MB-")).map(part => part.id).sort()).toEqual(["MB-01", "MB-02"]);
    expect(c2.placements.find(part => part.id === "MI-07")?.params?.edgeLights).toBe(true);
    expect(c2.placements.find(part => part.id === "MI-01")?.params?.size).toEqual([10, 9]);
    expect(c3.placements.map(part => part.id)).toContain("MB-11");
    expect(c4.placements.map(part => part.id)).toContain("MB-10");
    expect(c4.reservedAreas.map(area => area.id)).toContain("base-district");
    expect(c5.placements.filter(part => part.id === "MI-05")).toHaveLength(2);
    expect(final.reservedAreas).toEqual(c4.reservedAreas);
    expect(final.reservations.map(slot => slot.id)).toContain("MV-10");
    expect(final.placements).toEqual(parseColonyLayout(pilot, registry).placements);
  });

  it("composes the approved district once in the shared colony plan without the old garage", async () => {
    const source = parseColonyLayout(district);
    for (const chapter of ["c4", "c5", "final"]) {
      const host = parseColonyLayout(await loadColonyChapter(new URLSearchParams({ chapter })));
      const area = host.reservedAreas.find(area => area.id === "base-district")!;
      const plan = composeColonyLayout(host);
      const imported = plan.placements.filter(part => part.platform === "base-district");
      expect(imported).toHaveLength(source.placements.length);
      expect(plan.placements.filter(part => part.id === "MB-14")).toHaveLength(1);
      expect(host.placements.some(part => part.id === "NX-01")).toBe(false);
      const [ox, oz] = area.at;
      for (const [i, part] of imported.entries()) {
        const original = source.placements[i];
        expect(part.id).toBe(original.id === "MB-14" ? "MB-13" : original.id);
        expect(part.at[0]).toBeCloseTo(ox + original.at[1]);
        expect(part.at[1]).toBeCloseTo(oz - original.at[0]);
        expect(part.rot).toBe((original.rot ?? 0) + 90);
        expect(part.params).toEqual(original.params);
      }
      const [arterial, hub] = plan.placements.filter(part => part.id === "MI-01" && part.districtConnector);
      expect(arterial.at[0]).toBeCloseTo(ox + 26.8);
      expect(arterial.at[1]).toBeCloseTo(oz + 9.2);
      expect(arterial.params?.path).toContainEqual([hub.at[0] - arterial.at[0], hub.at[1] - arterial.at[1]]);
      expect(plan.views[6]?.eyeHeight).toBe(1.5);
    }
    const starter = parseColonyLayout(await loadColonyChapter(new URLSearchParams("chapter=c3")));
    expect(composeColonyLayout(starter)).toEqual(starter);
  });

  it("matches the district road grade and reaches existing paving at both destinations", async () => {
    const host = parseColonyLayout(await loadColonyChapter(new URLSearchParams("chapter=c4")));
    const layout = composeColonyLayout(host);
    const paving = buildColonyGroup({
      ...layout,
      placements: layout.placements.filter(part => part.id === "MI-01"),
    }, createProductionRegistry());
    try {
      paving.updateMatrixWorld(true);
      expect(paving.getObjectByName("District compacted regolith bank")).toBeDefined();
      const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
      const top = (x: number, z: number) => {
        ray.ray.origin.set(x, 40, z);
        return ray.intersectObject(paving, true)[0]?.point.y;
      };
      const inside = top(-39.35, 20.7);
      const outside = top(-39.05, 20.7);
      expect(inside).toBeTypeOf("number");
      expect(outside).toBeTypeOf("number");
      expect(Math.abs(inside! - outside!)).toBeLessThan(0.07);
      for (const [x, z] of [[-16.2, 34.7], [-15.3, 35.4], [4.65, 13.04], [4.8, 12.41]]) {
        expect(top(x, z), `paving at ${x}, ${z}`).toBeTypeOf("number");
      }
    } finally {
      paving.dispose();
    }
  });

  it("frames the five chapters from distinct, closer three-quarter cameras", async () => {
    const views = await Promise.all(chapters.map(async chapter =>
      parseColonyLayout(await loadColonyChapter(new URLSearchParams({ chapter }))).views[0]));
    expect(new Set(views.map(view => view.position.join(","))).size).toBe(chapters.length);
    for (const [index, { position, target }] of views.entries()) {
      const [x, y, z] = position.map((coordinate, i) => coordinate - target[i]);
      expect(Math.hypot(x, y, z)).toBeLessThan(index < 2 ? 66 : 112);
      expect(Math.min(Math.abs(x), Math.abs(z))).toBeGreaterThan(8);
      expect(y / Math.hypot(x, z)).toBeLessThan(0.65);
    }
  });

  it("uses a fixed allowlist and only opens the polar expedition for C5 or final", async () => {
    const registry = createProductionRegistry();
    for (const chapter of ["", "../pilot", "__proto__", "c6"]) {
      const layout = await loadColonyChapter(new URLSearchParams({ chapter }));
      expect(parseColonyLayout(layout, registry).id).toBe("final");
    }
    const polar = await loadColonyChapter(new URLSearchParams("chapter=c5&site=polar"));
    expect(parseColonyLayout(polar, registry).biome).toBe("polar");
    const starter = await loadColonyChapter(new URLSearchParams("chapter=c2-inicio&site=polar"));
    expect(parseColonyLayout(starter, registry).id).toBe("c2-inicio");
  });

  it("defaults to the chapter preset and preserves the polar biome during Jezero overrides", async () => {
    const c2 = parseColonyLayout(await loadColonyChapter(new URLSearchParams("chapter=c2")));
    const c4 = parseColonyLayout(await loadColonyChapter(new URLSearchParams("chapter=c4")));
    const polar = parseColonyLayout(await loadColonyChapter(new URLSearchParams("chapter=c5&site=polar")));
    const environment = (layout: typeof c4, search = "") => selectColonyEnvironment(layout, new URLSearchParams(search));
    expect(environment(c2).id).toBe("AMB-04");
    expect(environment(c4).id).toBe("AMB-06");
    expect(environment(c4, "weather=clear").id).toBe("AMB-04");
    expect(environment(c4, "time=night").id).toBe("AMB-08");
    expect(environment(c4, "weather=solar&time=night").light.sun).toBe("warning");
    expect(environment(polar, "weather=dust&time=night").id).toBe("AMB-07");
  });

  it("descends only in the final arrival view and stops on the actual pad deck", async () => {
    const plan = composeColonyLayout(parseColonyLayout(await loadColonyChapter(new URLSearchParams("chapter=final"))));
    expect(plan.views[7].id).toBe("family-arrival");
    const pad = plan.placements.find(item => item.id === "MI-07")!;
    const ground = 0.9;
    const flight = createFamilyArrival(pad, ground, createProductionRegistry());
    expect(flight.advance(4)).toBeNull();
    expect(flight.show(true, false)).toBeCloseTo(6.5);
    expect(flight.advance(4)).toBeLessThan(6.5);
    expect(flight.advance(8)).toBe(0);
    expect(flight.ship.position.toArray()).toEqual([pad.at[0], ground + pad.yOffset! + LANDING_PAD_DECK_HEIGHT, pad.at[1]]);
    flight.show(false, false);
    expect(flight.ship.visible).toBe(false);
    expect(flight.show(true, true)).toBe(0);
  });
});
