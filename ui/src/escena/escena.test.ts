/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LUZ, PALETA_CIELO, colorCielo, hexALineal, hexARgb } from "./cielo";
import {
  ESCALA_VERTICAL_POR_DEFECTO,
  MAX_TRIANGULOS_TERRENO,
  PASO_POR_DEFECTO,
  PRESUPUESTO,
  TAMANO_MUNDO_POR_DEFECTO,
  alturaEnMundo,
  leerDem,
  mallaTerreno,
  rocasBasalticas,
  submuestrear,
  type OpcionesMalla,
} from "./activos/terreno";

const dir = (f: string) => fileURLToPath(new URL(`../../../data/terreno/jezero/${f}`, import.meta.url));
const jezero = JSON.parse(readFileSync(dir("jezero.json"), "utf-8")) as {
  dem: { archivo: string; ancho: number; alto: number; metrosPorPixel: number; minM: number; maxM: number };
};
const { ancho, alto, minM, maxM, metrosPorPixel } = jezero.dem;
const ruta = dir(jezero.dem.archivo);
const archivo = readFileSync(ruta);
const buffer = archivo.buffer.slice(archivo.byteOffset, archivo.byteOffset + archivo.byteLength) as ArrayBuffer;
const dem = leerDem(buffer, ancho, alto);
const rejilla = submuestrear(dem, ancho, alto, PASO_POR_DEFECTO);
const opciones: OpcionesMalla = {
  metrosPorPixel: metrosPorPixel * PASO_POR_DEFECTO,
  escalaVertical: ESCALA_VERTICAL_POR_DEFECTO,
  tamañoMundo: TAMANO_MUNDO_POR_DEFECTO,
};

describe("terreno de Jezero", () => {
  it("lee el DEM real con 280×280 valores dentro de [minM, maxM]", () => {
    expect(ancho).toBe(280);
    expect(alto).toBe(280);
    expect(dem.length).toBe(280 * 280);
    let min = Infinity, max = -Infinity;
    for (const h of dem) { min = Math.min(min, h); max = Math.max(max, h); }
    expect(min).toBeGreaterThanOrEqual(minM);
    expect(max).toBeLessThanOrEqual(maxM);
  });

  it("la malla por defecto cabe en ≤20 000 triángulos y está centrada", () => {
    const m = mallaTerreno(rejilla.alturas, rejilla.ancho, rejilla.alto, opciones);
    expect(m.triangulos).toBeLessThanOrEqual(MAX_TRIANGULOS_TERRENO);
    expect(m.triangulos).toBeLessThanOrEqual(PRESUPUESTO.triangulos);
    expect(m.indices.length).toBe(m.triangulos * 3);
    const lim = [[Infinity, -Infinity], [Infinity, -Infinity], [Infinity, -Infinity]] as [number, number][];
    for (let i = 0; i < m.posiciones.length; i++) {
      const v = m.posiciones[i]!;
      const l = lim[i % 3]!;
      l[0] = Math.min(l[0], v); l[1] = Math.max(l[1], v);
    }
    for (const [a, b] of lim) expect(Math.abs(a + b)).toBeLessThan(1e-3);
    expect(lim[0]![1] - lim[0]![0]).toBeCloseTo(TAMANO_MUNDO_POR_DEFECTO, 3);
  });

  it("la opción facetada duplica vértices por triángulo", () => {
    const m = mallaTerreno(rejilla.alturas, rejilla.ancho, rejilla.alto, { ...opciones, facetada: true });
    expect(m.posiciones.length).toBe(m.triangulos * 9);
    expect(m.indices.length).toBe(m.triangulos * 3);
  });

  it("las rocas son deterministas por semilla y caen sobre el terreno", () => {
    const a = rocasBasalticas(42, 30, rejilla, opciones);
    const b = rocasBasalticas(42, 30, rejilla, opciones);
    const c = rocasBasalticas(7, 30, rejilla, opciones);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const r of a) {
      const [x, y, z] = r.posicion;
      expect(Math.abs(x)).toBeLessThanOrEqual(TAMANO_MUNDO_POR_DEFECTO / 2);
      expect(Math.abs(z)).toBeLessThanOrEqual(TAMANO_MUNDO_POR_DEFECTO / 2);
      expect(y).toBeCloseTo(alturaEnMundo(rejilla, opciones, x, z), 6);
    }
  });

  it("alturaEnMundo coincide con los vértices de la malla", () => {
    const m = mallaTerreno(rejilla.alturas, rejilla.ancho, rejilla.alto, opciones);
    for (const i of [0, 137, 4000, rejilla.ancho * rejilla.alto - 1]) {
      const [x, y, z] = [m.posiciones[i * 3]!, m.posiciones[i * 3 + 1]!, m.posiciones[i * 3 + 2]!];
      expect(alturaEnMundo(rejilla, opciones, x, z)).toBeCloseTo(y, 3);
    }
  });
});

describe("orientación de la malla", () => {
  it("todas las caras miran hacia arriba (+Y) en un terreno plano", () => {
    // Rejilla plana 3×3: si el enrollado estuviera al revés, la normal saldría hacia −Y.
    const m = mallaTerreno(new Float32Array(9), 3, 3, { metrosPorPixel: 1, escalaVertical: 1, tamañoMundo: 2 });
    const p = (v: number) => [m.posiciones[v * 3]!, m.posiciones[v * 3 + 1]!, m.posiciones[v * 3 + 2]!];
    for (let t = 0; t < m.triangulos; t++) {
      const [a, b, c] = [p(m.indices[t * 3]!), p(m.indices[t * 3 + 1]!), p(m.indices[t * 3 + 2]!)];
      const u = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
      const v = [c[0]! - a[0]!, c[1]! - a[1]!, c[2]! - a[2]!];
      const normalY = u[2]! * v[0]! - u[0]! * v[2]!; // componente Y de u × v
      expect(normalY, `triángulo ${t}`).toBeGreaterThan(0);
    }
  });
});

describe("cielo de Marte", () => {
  it("de día no es azul: azul < rojo en cénit y horizonte", () => {
    for (const hex of [PALETA_CIELO.dia.cenit, PALETA_CIELO.dia.horizonte]) {
      const [r, , b] = hexARgb(hex);
      expect(b).toBeLessThan(r);
    }
    for (const t of [0, 0.5, 1]) {
      const [r, , b] = colorCielo(t, "dia");
      expect(b).toBeLessThan(r);
    }
  });

  it("la interpolación da exactamente el horizonte en t=0 y el cénit en t=1", () => {
    for (const amb of ["dia", "atardecer"] as const) {
      expect(colorCielo(0, amb)).toEqual(hexALineal(PALETA_CIELO[amb].horizonte));
      expect(colorCielo(1, amb)).toEqual(hexALineal(PALETA_CIELO[amb].cenit));
    }
  });

  it("la luz respeta MARTE.md §5", () => {
    expect(Math.hypot(...LUZ.direccionSol)).toBeCloseTo(1, 10);
    expect(LUZ.direccionSol[0]).toBeLessThan(0);
    expect(LUZ.direccionSol[1]).toBeGreaterThan(0);
    expect(LUZ.tamanoSombra.alta).toBeLessThanOrEqual(2048);
    expect(LUZ.tamanoSombra.baja).toBeLessThanOrEqual(LUZ.tamanoSombra.alta);
    expect(LUZ.toneMapping).toBe("AgX");
    expect(LUZ.exposicion).toBeCloseTo(1.05, 5);
  });
});

describe("módulos de la base (sin Three)", async () => {
  const { MODULOS_BASE, partesVisibles, construidos, respetaMaximoConstruidos, TIEMPOS_MODULO_MS } = await import("./activos/modulos");
  type E = import("@solar-shield/contracts").Equipment;
  type S = import("./vista").EstadoModulo;
  const vista = (cambios: Partial<Record<E, S>>): Record<E, S> => ({
    panel_solar: "ausente", bateria: "ausente", reciclador_agua: "ausente", invernadero: "ausente",
    escudo: "ausente", antena: "ausente", ia_base: "funcionando", ...cambios,
  });

  it("los cinco anclajes son los de ESCENAS §3.2 y el anclaje se ve siempre", () => {
    expect([...MODULOS_BASE].sort()).toEqual(["antena", "escudo", "invernadero", "panel_solar", "reciclador_agua"]);
    for (const s of ["ausente", "instalando", "funcionando", "averiado"] as const) expect(partesVisibles(s).anclaje).toBe(true);
  });

  it("cada estado muestra lo suyo: andamio al instalar, vivos solo al funcionar", () => {
    expect(partesVisibles("ausente")).toMatchObject({ solido: false, andamio: false, vivos: false });
    expect(partesVisibles("instalando")).toMatchObject({ solido: false, andamio: true, vivos: false });
    expect(partesVisibles("funcionando")).toMatchObject({ solido: true, andamio: false, vivos: true });
    expect(partesVisibles("averiado")).toMatchObject({ solido: true, vivos: false });
    expect(TIEMPOS_MODULO_MS).toEqual({ instalando: 400, operativo: 240 });
  });

  it("las 10 parejas de 2 módulos se ven construidas y respetan el máximo; 3 no", () => {
    let parejas = 0;
    for (let i = 0; i < MODULOS_BASE.length; i++)
      for (let j = i + 1; j < MODULOS_BASE.length; j++) {
        const v = vista({ [MODULOS_BASE[i]!]: "funcionando", [MODULOS_BASE[j]!]: "instalando" });
        expect(construidos(v)).toHaveLength(2);
        expect(respetaMaximoConstruidos(v)).toBe(true);
        parejas++;
      }
    expect(parejas).toBe(10);
    expect(respetaMaximoConstruidos(vista({ panel_solar: "funcionando", escudo: "funcionando", antena: "funcionando" }))).toBe(false);
    // La IA y la batería no son anclajes: no cuentan como módulos construidos.
    expect(construidos(vista({ bateria: "funcionando" }))).toHaveLength(0);
  });
});
