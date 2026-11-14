import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type EfectoOpcion } from "./jezero.js";
import { TEXTOS_JEZERO } from "./textos.js";

const RECURSOS = ["energia", "soporte_vital", "blindaje"] as const;

function terreno(): { sitios: { id: string }[] } {
  const ruta = fileURLToPath(
    new URL(`../../data/terreno/${MISION_JEZERO.terrenoId}/${MISION_JEZERO.terrenoId}.json`, import.meta.url),
  );
  return JSON.parse(readFileSync(ruta, "utf-8"));
}

/** Efecto neto de una opción por medidor (inmediato + retrasado). */
function neto(e: EfectoOpcion): Record<(typeof RECURSOS)[number], number> {
  return Object.fromEntries(RECURSOS.map((r) => [r, (e.inmediato[r] ?? 0) + (e.retrasado[r] ?? 0)])) as Record<
    (typeof RECURSOS)[number],
    number
  >;
}

describe("misión Jezero", () => {
  it("cada sitio candidato existe en data/terreno", () => {
    const ids = terreno().sitios.map((s) => s.id);
    expect(MISION_JEZERO.sitiosCandidatos.length).toBeGreaterThanOrEqual(3);
    for (const s of MISION_JEZERO.sitiosCandidatos) expect(ids).toContain(s.id);
  });

  it("ningún aterrizaje es gratis: mueve ≥ 2 medidores y algo baja ya", () => {
    for (const s of MISION_JEZERO.sitiosCandidatos) {
      const movidos = RECURSOS.filter((r) => (s.aterrizaje.inmediato[r] ?? 0) !== 0 || (s.aterrizaje.retrasado[r] ?? 0) !== 0);
      expect(movidos.length, s.id).toBeGreaterThanOrEqual(2);
      expect(Object.values(s.aterrizaje.inmediato).some((v) => v < 0), s.id).toBe(true);
    }
  });

  it("ningún sitio domina a otro en todos los medidores", () => {
    const sitios = MISION_JEZERO.sitiosCandidatos.map((s) => ({ id: s.id, n: neto(s.aterrizaje) }));
    for (const a of sitios)
      for (const b of sitios) {
        if (a.id === b.id) continue;
        const domina = RECURSOS.every((r) => a.n[r] >= b.n[r]) && RECURSOS.some((r) => a.n[r] > b.n[r]);
        expect(domina, `${a.id} domina a ${b.id}`).toBe(false);
      }
  });

  it("la avería de Iris se revela en un paso que existe, después de la tormenta", () => {
    const pasos = MISION_JEZERO.pasos.map((p) => p.n);
    expect(pasos).toContain(MISION_JEZERO.averiaIris.pasoRevelacion);
    const pasoTormenta = MISION_JEZERO.pasos.find((p) => p.meta === "tormenta_llega")!.n;
    expect(MISION_JEZERO.averiaIris.pasoRevelacion).toBeGreaterThan(pasoTormenta);
    expect(MISION_JEZERO.averiaIris.equipo).toBe(MISION_JEZERO.averiaInicial);
    expect(MISION_JEZERO.averiaIris.errorLectura).toBeGreaterThan(0);
  });

  it("el tope de ticks deja llegar la tormenta antes del final", () => {
    expect(MISION_JEZERO.fin.tickLimite).toBeGreaterThan(MISION_JEZERO.tickTormenta);
  });

  it("cada clave de texto de la misión existe en en y es", () => {
    const claves = [
      MISION_JEZERO.nombreKey,
      ...MISION_JEZERO.pasos.map((p) => p.tituloKey),
      ...MISION_JEZERO.sitiosCandidatos.map((s) => s.porQueKey),
    ];
    for (const idioma of ["en", "es"] as const)
      for (const k of claves) expect(TEXTOS_JEZERO[idioma][k], `${idioma}:${k}`).toBeTruthy();
  });
});
