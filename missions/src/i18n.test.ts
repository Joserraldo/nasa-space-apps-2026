import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TEXTOS_JEZERO } from "./textos.js";

const raiz = join(__dirname, "..", "..");
const leer = (ruta: string): Record<string, string> => JSON.parse(readFileSync(join(raiz, ruta), "utf8"));

// Textos de diseño en JSON; los de la misión viven en missions/src/textos.ts (TEXTOS_JEZERO, de Camilo).
const en = { ...leer("design/i18n/en.json"), ...TEXTOS_JEZERO.en };
const es = { ...leer("design/i18n/es.json"), ...TEXTOS_JEZERO.es };

/** Claves que el motor, diseño y misiones escriben en el estado y que la pantalla debe poder traducir. */
function clavesUsadas(): string[] {
  const patron = /"((?:causa|mala_suerte|ia|rango|insignia|sitio\.rango|mision)\.[a-z0-9_.]+)"/g;
  const claves = new Set<string>();
  for (const carpeta of ["design/src", "missions/src", "engine/src"]) {
    for (const archivo of readdirSync(join(raiz, carpeta))) {
      if (!archivo.endsWith(".ts") || archivo.endsWith(".test.ts")) continue;
      const texto = readFileSync(join(raiz, carpeta, archivo), "utf8");
      for (const m of texto.matchAll(patron)) claves.add(m[1]!);
    }
  }
  return [...claves].sort();
}

describe("textos de diseño y misiones", () => {
  it("inglés (base) y español tienen exactamente las mismas claves", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it("cada clave usada en el código tiene texto en inglés y en español", () => {
    const faltan = clavesUsadas().filter((k) => !en[k] || !es[k]);
    expect(faltan).toEqual([]);
  });

  it("ningún texto está vacío ni muestra una clave técnica", () => {
    for (const [k, v] of [...Object.entries(en), ...Object.entries(es)]) {
      expect(v.trim().length, k).toBeGreaterThan(0);
      expect(v, k).not.toMatch(/^[a-z_]+\.[a-z_.]+$/);
    }
  });
});
