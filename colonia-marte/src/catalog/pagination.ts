export const CATALOG_PAGE_SIZE = 12;
export interface CatalogItem { label: string }

export function catalogFamily(label: string): string {
  return label.match(/^[A-Z]+(?:-[A-Z]+)?(?=\d|\s|$|-)/)?.[0] ?? "Primitives";
}

/** Filter before slicing; clamp stale page numbers after a family change. */
export function catalogPage<T extends CatalogItem>(items: readonly T[], family: string, requestedPage: number) {
  const filtered = family === "All" ? items : items.filter(item => catalogFamily(item.label) === family);
  const pages = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const page = Math.max(0, Math.min(pages - 1, Math.trunc(requestedPage) || 0));
  return {
    items: filtered.slice(page * CATALOG_PAGE_SIZE, (page + 1) * CATALOG_PAGE_SIZE),
    page, pages, total: filtered.length,
  };
}
