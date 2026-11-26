import { describe, expect, it } from "vitest";
import pilot from "../../data/layouts/colonies/exterior-pilot.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { loadColonyChapter } from "../../src/scenes/colony-chapters";
import { parseColonyLayout } from "../../src/scenes/colony-layout";

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
    expect(layouts.every(layout => JSON.stringify(layout.views[0]) === JSON.stringify(c2.views[0]))).toBe(true);
    expect(c2.placements.filter(part => part.id.startsWith("MB-")).map(part => part.id).sort()).toEqual(["MB-01", "MB-02"]);
    expect(c2.placements.find(part => part.id === "MI-07")?.params?.edgeLights).toBe(true);
    expect(c2.placements.find(part => part.id === "MI-01")?.params?.size).toEqual([10, 9]);
    expect(c3.placements.map(part => part.id)).toContain("MB-11");
    expect(c4.placements.map(part => part.id)).toEqual(expect.arrayContaining(["NX-01", "MB-10", "MV-01", "MV-03", "MV-11"]));
    expect(c4.reservedAreas.map(area => area.id)).toContain("base-district");
    expect(c5.placements.filter(part => part.id === "MI-05")).toHaveLength(2);
    expect(final.reservedAreas).toEqual(c4.reservedAreas);
    expect(final.reservations.map(slot => slot.id)).toContain("MV-10");
    expect(final.placements).toEqual(parseColonyLayout(pilot, registry).placements);
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
});
