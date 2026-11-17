/**
 * P0.2: la misión se pierde si la dosis de radiación de la tripulación supera su límite.
 * El límite es un presupuesto de juego (`Mision.limiteDosisMSv`), no un umbral de salud.
 * Los valores esperados se calculan con la misión y el motor, nunca con números a mano.
 */
import { describe, expect, it } from "vitest";
import { MISION_JEZERO, MISION_LUNA_VISIBLE, type Mision } from "@solar-shield/missions";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { partidaDeMision, partidaDorada } from "./dorada.js";
import { dosisMaximaTripulacion } from "./radiacion.js";

/** Misma misión con otro presupuesto de radiación. */
const conLimite = (limite: number): Mision => ({ ...MISION_JEZERO, limiteDosisMSv: limite });

const tieneCausaLimite = (estado: ReturnType<typeof partidaDorada>): boolean =>
  estado.causas.some((c) => c.descripcionKey === "causa.limite_radiacion");

describe("P0.2 límite de dosis de la misión", () => {
  it("pierde en cuanto la dosis supera el límite, con una sola causa de radiación", () => {
    const mision = conLimite(0.001);
    let s = partidaDeMision(mision);
    while (s.resultado === "en_curso") s = avanzarTick(s, mision);

    expect(s.resultado).toBe("fallo");
    expect(dosisMaximaTripulacion(s)).toBeGreaterThan(mision.limiteDosisMSv!);
    expect(tieneCausaLimite(s)).toBe(true);

    const causa = s.causas.find((c) => c.descripcionKey === "causa.limite_radiacion");
    expect(causa).toEqual({ tick: s.tick, origen: "sistema", descripcionKey: "causa.limite_radiacion" });
  });

  it("no pierde si la dosis es exactamente igual al límite", () => {
    // La dosis de referencia es la que acumula la tripulación tras un turno normal.
    const referencia = avanzarTick(partidaDorada());
    const dosisDelTurno = dosisMaximaTripulacion(referencia);

    const mision = conLimite(dosisDelTurno);
    const s = avanzarTick(partidaDorada(), mision);

    expect(dosisMaximaTripulacion(s)).toBe(dosisDelTurno);
    expect(s.resultado).toBe("en_curso");
    expect(tieneCausaLimite(s)).toBe(false);
  });

  it("una misión sin limiteDosisMSv no pierde por dosis aunque sea alta", () => {
    const misionLuna: Mision = MISION_LUNA_VISIBLE;
    expect(misionLuna.limiteDosisMSv).toBeUndefined();
    const inicial = partidaDeMision(misionLuna);
    const conDosisAlta = {
      ...inicial,
      tripulacion: inicial.tripulacion.map((t) => (t.disponible ? { ...t, dosisMSv: 1000 } : t)),
    };

    const s = avanzarTick(conDosisAlta, misionLuna);

    expect(dosisMaximaTripulacion(s)).toBeGreaterThanOrEqual(1000);
    expect(s.resultado).toBe("en_curso");
    expect(tieneCausaLimite(s)).toBe(false);
  });

  it("tras la derrota por dosis, avanzarTick y aplicarAccion no cambian el estado", () => {
    const mision = conLimite(0.001);
    let s = partidaDeMision(mision);
    while (s.resultado === "en_curso") s = avanzarTick(s, mision);
    expect(s.resultado).toBe("fallo");
    expect(tieneCausaLimite(s)).toBe(true);

    expect(avanzarTick(s, mision)).toBe(s);
    expect(aplicarAccion(s, { tipo: "esperar" }, mision)).toBe(s);
  });

  it("si un recurso llega a 0 en el mismo turno, manda el recurso y no se añade la causa de radiación", () => {
    const mision = conLimite(0.001);
    const inicial = partidaDeMision(mision);
    const sinEnergia = { ...inicial, recursos: { ...inicial.recursos, energia: 0 } };

    const s = avanzarTick(sinEnergia, mision);

    expect(s.resultado).toBe("fallo");
    expect(s.recursos.energia).toBe(0);
    expect(dosisMaximaTripulacion(s)).toBeGreaterThan(mision.limiteDosisMSv!);
    expect(tieneCausaLimite(s)).toBe(false);
    expect(s.causas.some((c) => c.descripcionKey === "causa.consumo" && c.recurso === "energia")).toBe(true);
  });
});
