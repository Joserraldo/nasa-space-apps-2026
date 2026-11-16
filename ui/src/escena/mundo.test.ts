import { describe, expect, it } from "vitest";
import { resolver } from "./fisica.js";
import { puestoDeGuia } from "./guia.js";
import {
  ANCLAJES_EXPERTAS, ANCLAJES_MODULOS, DOCK_IRIS, LUGARES,
  RADIO_EXPERTA, TERRENO, lugar, lugarCercano, lugarDelModulo,
} from "./mundo.js";

// ESCENAS §3.2 y mapa-base-jezero.svg: uso x/z y centro mx/mz.
const PLANO = [
  ["mesa", 0, 1.6, 0, 0.2], ["habitat", 0, -4.3, 0, -8],
  ["taller", -4, 0.1, -4.8, -1.4], ["sensor", 10.8, 1, 11.7, -0.5],
  ["panel_solar", -8, -0.5, -8, -3.5], ["escudo", -4.5, -5.3, -5.4, -7.2],
  ["reciclador_agua", 4.6, -4.2, 5.4, -6.8], ["invernadero", 9, -0.4, 9, -5],
  ["antena", 9.6, 4.4, 11, 5.6], ["banco", -4.6, 4.4, -7.7, 6.7],
] as const;

describe("contrato de lugares v8", () => {
  it("conserva los diez identificadores y las medidas del plano canónico", () => {
    expect(new Set(LUGARES.map(l => l.id)).size).toBe(10);
    for (const [id, x, z, mx, mz] of PLANO) {
      expect(lugar(id)).toMatchObject({ id, x, z, mx, mz });
    }
  });

  it.each(LUGARES)("$id tiene punto de uso libre y radio finito positivo", l => {
    const p = { x: l.x, z: l.z };
    resolver(p, 0.38, TERRENO);
    expect(p.x).toBeCloseTo(l.x);
    expect(p.z).toBeCloseTo(l.z);
    expect(Number.isFinite(l.radio) && l.radio > 0).toBe(true);
    expect(lugarCercano(l.x, l.z)).toBe(l.id);
  });

  it("publica cinco anclajes estables de módulo, sin inventar equipos construidos", () => {
    expect(Object.keys(ANCLAJES_MODULOS).sort()).toEqual(
      ["antena", "escudo", "invernadero", "panel_solar", "reciclador_agua"],
    );
    for (const l of LUGARES.filter(l => l.modulo)) {
      const a = ANCLAJES_MODULOS[l.modulo as keyof typeof ANCLAJES_MODULOS];
      expect(a).toEqual({ id: `modulo:${l.id}`, lugarId: l.id, x: l.mx, y: 0, z: l.mz });
      expect(lugarDelModulo(l.modulo!)).toBe(l);
    }
    expect(lugarDelModulo("ia_base")).toBeUndefined();
    expect(lugarDelModulo("bateria")).toBeUndefined();
  });

  it("sitúa las expertas y el dock de Iris en sus sectores acordados", () => {
    for (const a of Object.values(ANCLAJES_EXPERTAS)) {
      const l = lugar(a.lugarId);
      expect(a.id).toBe(`experta:${l.experto}`);
      expect(a.y).toBe(0);
      expect(Math.hypot(a.x - l.x, a.z - l.z)).toBeGreaterThan(0.38 + RADIO_EXPERTA);
      const cuerpo = { x: a.x, z: a.z };
      resolver(cuerpo, RADIO_EXPERTA, TERRENO);
      expect(cuerpo.x).toBeCloseTo(a.x);
      expect(cuerpo.z).toBeCloseTo(a.z);
      // El niño conserva libre su punto de uso incluso con la experta como sólido.
      const uso = { x: l.x, z: l.z };
      resolver(uso, 0.38, TERRENO, [{ x: a.x, z: a.z, r: RADIO_EXPERTA }]);
      expect(uso).toEqual({ x: l.x, z: l.z });
    }
    expect(ANCLAJES_EXPERTAS.ingeniera.lugarId).toBe("taller");
    expect(ANCLAJES_EXPERTAS.doctora.lugarId).toBe("habitat");
    expect(ANCLAJES_EXPERTAS.meteorologa.lugarId).toBe("sensor");
    const ingeniera = ANCLAJES_EXPERTAS.ingeniera;
    expect(Math.hypot(ingeniera.x - DOCK_IRIS.x, ingeniera.z - DOCK_IRIS.z)).toBeGreaterThan(RADIO_EXPERTA + 0.38);
    expect(DOCK_IRIS).toEqual({ id: "iris:dock", lugarId: "taller", y: 0, ...puestoDeGuia(lugar("taller")) });
    const p = { x: DOCK_IRIS.x, z: DOCK_IRIS.z };
    resolver(p, 0.38, TERRENO);
    expect(p).toEqual({ x: DOCK_IRIS.x, z: DOCK_IRIS.z });
  });

  it("no ofrece interacciones fuera de la base", () => {
    expect(lugarCercano(19, 19)).toBeNull();
  });
});
