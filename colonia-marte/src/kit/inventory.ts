import inventory from "../../docs/INVENTARIO.md?raw";

/** Read only the first column of inventory tables, never arbitrary prose references. */
export const inventoryIds: ReadonlySet<string> = new Set(
  [...inventory.matchAll(/^\|\s*([A-Z]{2,3}-[A-Z0-9]+(?:-[A-Z0-9]+)*)\s*\|/gm)].map(match => match[1]),
);
