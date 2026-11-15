import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { aplicarAccion } from "./acciones.js";
import { partidaDeMision } from "./dorada.js";

const tick = (m: Mision) =>
  aplicarAccion(partidaDeMision(m, "s"), { tipo: "enviar_telemetria" }, m).efectosPendientes.find(
    (e) => e.descripcionKey === "causa.enviar_telemetria",
  )?.aplicaEnTick;

describe("retraso de comunicaciones por misión (#152)", () => {
  it("sin el campo usa el de design (Jezero = 2)", () => {
    expect(tick(MISION_JEZERO)).toBe(2);
  });
  it("con el campo usa el de la misión", () => {
    expect(tick({ ...MISION_JEZERO, retrasoComunicacionesTicks: 5 })).toBe(5);
    expect(tick({ ...MISION_JEZERO, retrasoComunicacionesTicks: 1 })).toBe(1);
  });
});
