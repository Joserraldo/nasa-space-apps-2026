import { describe, expect, it } from "vitest";
import { RETRASO_POR_DIFICULTAD } from "@solar-shield/design";
import { dosisMaximaTripulacion, puedeAplicar, queEsSi, tormentaActiva } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { inicial, reducir, type Juego } from "./reductor.js";
import { calcularTasa, estimarDosis } from "./dosis.js";

/** De la portada a la base viva (sitio y dos módulos), como la ruta dorada. */
function enBase(): Juego {
  let j = reducir(inicial(), { tipo: "fase", fase: "modulos" });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[0]! });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[1]! });
  return reducir(j, { tipo: "fase", fase: "base" });
}
/** Avanza el reloj hasta que llegue la tormenta. */
function conTormenta(): Juego {
  let j = enBase();
  for (let i = 0; i < 60 && j.fase !== "tormenta"; i++) j = reducir(reducir(j, { tipo: "pausa", pausado: false }), { tipo: "tick" });
  return j;
}

describe("calcularTasa", () => {
  it("sin lectura previa no hay tasa", () => {
    expect(calcularTasa(null, { tick: 0, dosis: 1 })).toBeUndefined();
  });

  it("con ticks consecutivos devuelve la diferencia", () => {
    expect(calcularTasa({ tick: 3, dosis: 1.2 }, { tick: 4, dosis: 1.6 })).toBeCloseTo(0.4, 9);
  });

  it("con ticks no consecutivos no hay tasa", () => {
    expect(calcularTasa({ tick: 3, dosis: 1 }, { tick: 5, dosis: 2 })).toBeUndefined();
    expect(calcularTasa({ tick: 3, dosis: 1 }, { tick: 3, dosis: 2 })).toBeUndefined();
    expect(calcularTasa({ tick: 4, dosis: 1 }, { tick: 3, dosis: 2 })).toBeUndefined();
  });

  it("nunca es negativa", () => {
    expect(calcularTasa({ tick: 3, dosis: 2 }, { tick: 4, dosis: 1 })).toBe(0);
    expect(calcularTasa({ tick: 3, dosis: 4 }, { tick: 4, dosis: 4 })).toBe(0);
  });
});

describe("estimarDosis", () => {
  const tormenta = conTormenta();
  // La tormenta pausa el juego al llegar; el horizonte se proyecta con el reloj andando.
  const enMarcha = { ...tormenta.estado, pausado: false };

  it("la partida llega a la tormenta", () => {
    expect(tormenta.fase).toBe("tormenta");
    expect(tormentaActiva(tormenta.estado, MISION_JEZERO)).toBe(true);
  });

  it("usa el horizonte de turnos de la dificultad, leído de design", () => {
    const r = estimarDosis(enMarcha, { tipo: "esperar" }, MISION_JEZERO);
    expect(r?.turnos).toBe(RETRASO_POR_DIFICULTAD[enMarcha.dificultad].max);
  });

  it("refugiarse proyecta menos dosis que esperar", () => {
    const refugio = estimarDosis(enMarcha, { tipo: "refugiarse" }, MISION_JEZERO);
    const espera = estimarDosis(enMarcha, { tipo: "esperar" }, MISION_JEZERO);
    expect(refugio).not.toBeNull();
    expect(espera).not.toBeNull();
    expect(refugio!.dosis).toBeLessThan(espera!.dosis);
  });

  it("esperar no ahorra nada respecto de esperar", () => {
    const r = estimarDosis(enMarcha, { tipo: "esperar" }, MISION_JEZERO);
    expect(r?.menosQueEsperar).toBe(0);
  });

  it("devuelve null cuando el motor no deja aplicar la acción", () => {
    const pobre = { ...enMarcha, recursos: { ...enMarcha.recursos, energia: 1 } };
    const accion = { tipo: "subir_escudo", nivel: 3 } as const;
    expect(puedeAplicar(pobre, accion, MISION_JEZERO).ok).toBe(false);
    expect(estimarDosis(pobre, accion, MISION_JEZERO)).toBeNull();
  });

  it("con la partida en pausa, como al llegar la tormenta, proyecta igual que con el reloj andando", () => {
    expect(tormenta.estado.pausado).toBe(true);
    for (const accion of [{ tipo: "refugiarse" }, { tipo: "esperar" }, { tipo: "subir_escudo", nivel: 2 }] as const) {
      const enPausa = estimarDosis(tormenta.estado, accion, MISION_JEZERO);
      const andando = estimarDosis(enMarcha, accion, MISION_JEZERO);
      expect(enPausa).toEqual(andando);
      // La tormenta sigue sumando: la proyección no puede quedarse en la dosis de ahora.
      expect(enPausa!.dosis).toBeGreaterThan(dosisMaximaTripulacion(tormenta.estado));
    }
  });

  it("en pausa, el refugio y el escudo proyectan menos que esperar", () => {
    const espera = estimarDosis(tormenta.estado, { tipo: "esperar" }, MISION_JEZERO)!;
    const refugio = estimarDosis(tormenta.estado, { tipo: "refugiarse" }, MISION_JEZERO)!;
    expect(refugio.dosis).toBeLessThan(espera.dosis);
    expect(refugio.menosQueEsperar).toBeGreaterThan(0.1);
  });

  it("la dosis es la que calcula el motor con queEsSi", () => {
    const accion = { tipo: "refugiarse" } as const;
    const r = estimarDosis(enMarcha, accion, MISION_JEZERO);
    expect(r?.dosis).toBe(dosisMaximaTripulacion(queEsSi(enMarcha, accion, MISION_JEZERO)));
  });
});
