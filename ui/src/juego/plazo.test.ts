import { describe, expect, it } from "vitest";
import { aplicarAccion, telemetriaPendiente } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { inicial, reducir, type Juego } from "./reductor.js";
import { plazoTelemetria } from "./plazo.js";

function enBase(): Juego {
  let j = reducir(inicial(), { tipo: "fase", fase: "modulos" });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[0]! });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[1]! });
  return reducir(j, { tipo: "fase", fase: "base" });
}
function conTormenta(): Juego {
  let j = enBase();
  for (let i = 0; i < 60 && j.fase !== "tormenta"; i++) j = reducir(reducir(j, { tipo: "pausa", pausado: false }), { tipo: "tick" });
  return j;
}

describe("plazoTelemetria", () => {
  it("el límite sale de la misión; antes de la tormenta no hay llegada que prometer", () => {
    const p = plazoTelemetria(enBase().estado, MISION_JEZERO);
    expect(p.limite).toBe(MISION_JEZERO.fin.tickLimite);
    expect(p.llegadaSiEnvia).toBeUndefined();
  });

  it("con la tormenta, la llegada la da el motor: es la que tendría la telemetría si se envía ahora", () => {
    const { estado } = conTormenta();
    const p = plazoTelemetria(estado, MISION_JEZERO);
    const real = telemetriaPendiente(aplicarAccion(estado, { tipo: "enviar_telemetria" }, MISION_JEZERO))?.llegaEnTick;
    expect(real).toBeDefined();
    expect(p.llegadaSiEnvia).toBe(real);
    expect(p.llegadaSiEnvia!).toBeGreaterThan(estado.tick);
  });

  it("después de enviarla ya no promete otra llegada", () => {
    const { estado } = conTormenta();
    const enviada = aplicarAccion(estado, { tipo: "enviar_telemetria" }, MISION_JEZERO);
    expect(plazoTelemetria(enviada, MISION_JEZERO).llegadaSiEnvia).toBeUndefined();
  });

  it("si ya no da tiempo, la llegada queda después del límite", () => {
    const { estado } = conTormenta();
    const tarde = { ...estado, tick: MISION_JEZERO.fin.tickLimite - 1 };
    const p = plazoTelemetria(tarde, MISION_JEZERO);
    expect(p.llegadaSiEnvia).toBeDefined();
    expect(p.llegadaSiEnvia!).toBeGreaterThan(p.limite);
  });
});
