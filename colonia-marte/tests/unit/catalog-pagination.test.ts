import { describe, expect, it } from "vitest";
import { catalogFamily, catalogPage, CATALOG_PAGE_SIZE } from "../../src/catalog/pagination";

describe("catalog family filtering and pagination", () => {
  const entries = Array.from({ length: 81 }, (_, i) => ({ label: `${i < 55 ? "ST-W01" : "DN-01"} / v${i}` }));
  it("uses ID prefixes and groups primitives separately", () => {
    expect(catalogFamily("ST-W01 / solid")).toBe("ST-W");
    expect(catalogFamily("DN-04 / default")).toBe("DN");
    expect(catalogFamily("CH-09 / happy")).toBe("CH");
    expect(catalogFamily("chamferBox")).toBe("Primitives");
  });
  it("shows at most 12 entries, without skipping or duplicating entries across pages", () => {
    expect(CATALOG_PAGE_SIZE).toBe(12);
    const pages = Array.from({ length: 7 }, (_, i) => catalogPage(entries, "All", i));
    expect(pages.map(p => p.items.length)).toEqual([12, 12, 12, 12, 12, 12, 9]);
    expect(pages.flatMap(p => p.items)).toEqual(entries);
  });
  it("filters before pagination, clamps stale pages and handles empty results", () => {
    const page = catalogPage(entries, "DN", 1);
    expect(page.total).toBe(26); expect(page.pages).toBe(3);
    expect(page.items).toEqual(entries.slice(67, 79));
    expect(catalogPage(entries, "DN", 8).page).toBe(2);
    expect(catalogPage(entries, "DN", -1).page).toBe(0);
    expect(catalogPage(entries, "Missing", 0)).toMatchObject({ items: [], page: 0, pages: 1, total: 0 });
  });
});
