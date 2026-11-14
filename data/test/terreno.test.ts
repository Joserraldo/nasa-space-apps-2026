import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { curarJezero } from "../scripts/jezero-curar";
import { terrenoJezero } from "../src";

const dir = join(__dirname, "..", "terreno", "jezero");
const es = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "es.json"), "utf-8"));
const en = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "en.json"), "utf-8"));

describe("terreno de Jezero", () => {
  it("se regenera idéntico desde el DEM (nadie editó un puntaje a mano)", () => {
    expect(JSON.parse(readFileSync(join(dir, "jezero.json"), "utf-8"))).toEqual(curarJezero());
  });

  it("el DEM tiene el tamaño declarado y alturas plausibles para Jezero", () => {
    const { ancho, alto, minM, maxM } = terrenoJezero.dem;
    expect(statSync(join(dir, terrenoJezero.dem.archivo)).size).toBe(ancho * alto * 2);
    expect(minM).toBeLessThan(-2500); // fondo del cráter, muy bajo el nivel de referencia
    expect(maxM).toBeGreaterThan(minM + 1000);
  });

  it("existen todas las imágenes", () => {
    expect(statSync(join(dir, terrenoJezero.imagenes.sombreado)).size).toBeGreaterThan(10_000);
    for (const t of terrenoJezero.imagenes.ctx) expect(statSync(join(dir, t.archivo)).size).toBeGreaterThan(1_000);
  });

  it("ningún sitio es perfecto: cada uno tiene al menos un puntaje bajo 0,65", () => {
    for (const s of terrenoJezero.sitios) expect(Math.min(...Object.values(s.puntajes)), s.id).toBeLessThan(0.65);
  });

  it("textos es/en para el mapa, cada sitio, la fuente y la nota de valores derivados", () => {
    const claves = [terrenoJezero.nombreKey, terrenoJezero.fuente.nombreKey, terrenoJezero.fuente.derivadoKey];
    for (const s of terrenoJezero.sitios) claves.push(s.nombreKey, s.descripcionKey);
    for (const k of claves) {
      expect(es[k], k).toBeTruthy();
      expect(en[k], k).toBeTruthy();
    }
  });
});

describe("fuenteTerreno (para los consejos de aterrizaje)", () => {
  it("es una SourceCard válida del contrato, con dueño y nota de valores derivados", async () => {
    const { fuenteTerreno } = await import("../src");
    const { SourceCardSchema } = await import("../src/contrato");
    const f = fuenteTerreno();
    expect(SourceCardSchema.safeParse(f).success).toBe(true);
    expect(f.dueno).toContain("Mars Trek");
    expect(es[f.nombreKey]).toBeTruthy();
    expect(en[terrenoJezero.fuente.derivadoKey]).toBeTruthy();
  });
});
