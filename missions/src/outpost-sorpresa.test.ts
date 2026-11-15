import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { EfectoOpcion } from "./jezero.js";
import { MISION_OUTPOST_SORPRESA as M } from "./outpost-sorpresa.js";
import { TEXTOS_OUTPOST_SORPRESA as T } from "./textos.js";

const RECURSOS = ["energia", "soporte_vital", "blindaje"] as const;
const raiz = (ruta: string) => fileURLToPath(new URL(`../../${ruta}`, import.meta.url));

/** Efecto neto de una opción por medidor (inmediato + retrasado). */
function neto(e: EfectoOpcion): Record<(typeof RECURSOS)[number], number> {
  return Object.fromEntries(RECURSOS.map((r) => [r, (e.inmediato[r] ?? 0) + (e.retrasado[r] ?? 0)])) as Record<
    (typeof RECURSOS)[number],
    number
  >;
}

describe("misión outpost sorpresa", () => {
  it("es el sitio outpost_sorpresa y su tormenta está curada en data/", () => {
    expect(M.sitio).toBe("outpost_sorpresa");
    expect(existsSync(raiz(`data/curated/${M.tormentaId}.json`))).toBe(true);
  });

  it("las zonas de la nave son las 3 de la propuesta y no hay terreno (hueco documentado)", () => {
    expect(M.sitiosCandidatos.map((s) => s.id)).toEqual(["cabina", "centro", "fondo"]);
    expect(existsSync(raiz(`data/terreno/${M.terrenoId}`))).toBe(false);
  });

  it("ninguna zona es gratis: mueve ≥ 2 medidores y algo baja ya", () => {
    for (const s of M.sitiosCandidatos) {
      const movidos = RECURSOS.filter((r) => (s.aterrizaje.inmediato[r] ?? 0) !== 0 || (s.aterrizaje.retrasado[r] ?? 0) !== 0);
      expect(movidos.length, s.id).toBeGreaterThanOrEqual(2);
      expect(Object.values(s.aterrizaje.inmediato).some((v) => v < 0), s.id).toBe(true);
    }
  });

  it("ninguna zona domina a otra en todos los medidores", () => {
    const zonas = M.sitiosCandidatos.map((s) => ({ id: s.id, n: neto(s.aterrizaje) }));
    for (const a of zonas)
      for (const b of zonas) {
        if (a.id === b.id) continue;
        const domina = RECURSOS.every((r) => a.n[r] >= b.n[r]) && RECURSOS.some((r) => a.n[r] > b.n[r]);
        expect(domina, `${a.id} domina a ${b.id}`).toBe(false);
      }
  });

  it("sin invernadero: no cabe una huerta en la nave", () => {
    expect(M.modulosDisponibles).not.toContain("invernadero");
    expect(M.modulosDisponibles).toHaveLength(5);
  });

  it("la avería de Iris se revela después de la tormenta y el tope de ticks la deja llegar", () => {
    const pasoTormenta = M.pasos.find((p) => p.meta === "tormenta_llega")!.n;
    expect(M.pasos.map((p) => p.n)).toContain(M.averiaIris.pasoRevelacion);
    expect(M.averiaIris.pasoRevelacion).toBeGreaterThan(pasoTormenta);
    expect(M.averiaIris.equipo).toBe(M.averiaInicial);
    expect(M.fin.tickLimite).toBeGreaterThan(M.tickTormenta);
  });
});

describe("outpost: micrometeorito y dilema del refugio", () => {
  it("el micrometeorito baja el panel, no sale en la semilla dorada y repararlo es una acción válida", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const p = M.eventoPolvo;
    expect(p.rendimientoPanel).toBeGreaterThan(0);
    expect(p.rendimientoPanel).toBeLessThan(1);
    expect(p.enSemillaDorada).toBe(false);
    expect(ActionSchema.safeParse(p.limpiar).success).toBe(true);
  });

  it("el dilema tiene 3 salidas válidas y distintas, con Doctora e Ingeniera en lados opuestos", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const ops = M.dilemaPaso6.opciones;
    expect(ops).toHaveLength(3);
    expect(new Set(ops.map((o) => o.id)).size).toBe(3);
    for (const o of ops) expect(ActionSchema.safeParse(o.accion).success, o.id).toBe(true);
    expect(ops.find((o) => o.accion.tipo === "refugiarse")?.defiende).toBe("doctora");
    expect(ops.find((o) => o.accion.tipo === "subir_escudo")?.defiende).toBe("ingeniera");
  });

  it("un efecto extra del dilema, si existe, solo resta", () => {
    for (const o of M.dilemaPaso6.opciones) {
      if (!o.extra) continue;
      expect(Object.values(neto(o.extra)).every((v) => v <= 0), o.id).toBe(true);
    }
  });
});

describe("outpost: textos, tarjetas y fuentes", () => {
  const fuentesDatos = JSON.parse(readFileSync(raiz("data/i18n/en.json"), "utf-8")) as Record<string, string>;

  it("cada clave de texto de la misión existe en inglés y en español", () => {
    const p = M.preguntaFinal;
    const claves = [
      M.nombreKey,
      ...M.pasos.map((x) => x.tituloKey),
      ...M.sitiosCandidatos.map((s) => s.porQueKey),
      M.eventoPolvo.textoKey,
      M.dilemaPaso6.preguntaKey,
      ...M.dilemaPaso6.opciones.map((o) => o.textoKey),
      ...M.tarjetasCiencia.map((t) => t.textoKey),
      p.preguntaKey,
      ...p.opcionesKeys,
      p.explicacionKey,
    ];
    for (const idioma of ["en", "es"] as const)
      for (const k of claves) expect(T[idioma][k], `${idioma}:${k}`).toBeTruthy();
    expect(Object.keys(T.es).sort()).toEqual(Object.keys(T.en).sort());
  });

  it("una fuente citada existe de verdad en los textos de datos", () => {
    for (const t of M.tarjetasCiencia) if (t.fuenteKey !== null) expect(fuentesDatos[t.fuenteKey], t.id).toBeTruthy();
    expect(fuentesDatos[M.preguntaFinal.fuenteKey!]).toBeTruthy();
  });

  it("cada módulo tiene su tarjeta y las tarjetas de la tormenta tienen fuente", () => {
    const conTarjeta = new Set(M.tarjetasCiencia.map((t) => t.modulo).filter(Boolean));
    for (const m of M.modulosDisponibles) expect(conTarjeta.has(m), m).toBe(true);
    for (const id of ["orion_medidor", "tormenta_real", "tormenta_crater"])
      expect(M.tarjetasCiencia.find((t) => t.id === id)?.fuenteKey, id).not.toBeNull();
  });

  it("nunca mezcla µGy/h con mSv en un mismo texto, y el Kp de la Tierra no aparece", () => {
    for (const v of [...Object.values(T.en), ...Object.values(T.es)]) {
      expect(v.includes("µGy") && v.includes("mSv"), v).toBe(false);
      expect(v).not.toMatch(/\bKp\b/);
    }
  });
});
