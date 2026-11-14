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

describe("misión 1: polvo y dilema del paso 6 (propuesta #88)", () => {
  it("el polvo baja el rendimiento del panel, no sale en la semilla dorada y limpiarlo es una acción válida", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const p = MISION_JEZERO.eventoPolvo;
    expect(p.rendimientoPanel).toBeGreaterThan(0);
    expect(p.rendimientoPanel).toBeLessThan(1);
    expect(p.enSemillaDorada).toBe(false);
    expect(ActionSchema.safeParse(p.limpiar).success).toBe(true);
  });

  it("el dilema tiene 3 salidas válidas, distintas y con al menos dos expertos que se contradicen", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const ops = MISION_JEZERO.dilemaPaso6.opciones;
    expect(ops).toHaveLength(3);
    expect(new Set(ops.map((o) => o.id)).size).toBe(3);
    for (const o of ops) expect(ActionSchema.safeParse(o.accion).success, o.id).toBe(true);
    const defensores = ops.map((o) => o.defiende).filter((e) => e !== null);
    expect(new Set(defensores).size).toBeGreaterThanOrEqual(2);
  });

  it("apagar el invernadero cuesta: el efecto extra solo resta", () => {
    const refugio = MISION_JEZERO.dilemaPaso6.opciones.find((o) => o.id === "refugio_y_apagar_invernadero")!;
    expect(refugio.extraSiTiene).toBe("invernadero");
    const n = neto(refugio.extra!);
    expect(Object.values(n).every((v) => v <= 0)).toBe(true);
    expect(Object.values(n).some((v) => v < 0)).toBe(true);
  });

  it("cada texto del polvo y del dilema existe en inglés y en español", () => {
    const claves = [
      MISION_JEZERO.eventoPolvo.textoKey,
      MISION_JEZERO.dilemaPaso6.preguntaKey,
      ...MISION_JEZERO.dilemaPaso6.opciones.map((o) => o.textoKey),
    ];
    for (const k of claves) {
      expect(TEXTOS_JEZERO.en[k], k).toBeTruthy();
      expect(TEXTOS_JEZERO.es[k], k).toBeTruthy();
    }
  });
});
