import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { avanzarTick } from "./acciones.js";
import { partidaDeMision } from "./dorada.js";

const AMANECER: Mision = {
  ...MISION_JEZERO,
  fin: { ...MISION_JEZERO.fin, exitoCuando: { tipo: "sobrevivir_hasta_tick", tick: 4 } },
};

describe("victoria por sobrevivir hasta un tick (#152)", () => {
  it("gana al llegar al tick, sin enviar telemetría", () => {
    let s = partidaDeMision(AMANECER, "s");
    for (let i = 0; i < 3; i++) s = avanzarTick({ ...s, recursos: { energia: 90, soporte_vital: 90, blindaje: 90 } }, AMANECER);
    expect(s.resultado).toBe("en_curso");
    s = avanzarTick({ ...s, recursos: { energia: 90, soporte_vital: 90, blindaje: 90 } }, AMANECER);
    expect(s.tick).toBe(4);
    expect(s.resultado).toBe("exito");
  });
  it("si un medidor llega a 0 en ese tick, pierde", () => {
    let s = partidaDeMision(AMANECER, "s");
    s = { ...s, tick: 3, recursos: { energia: 1, soporte_vital: 90, blindaje: 90 } };
    expect(avanzarTick(s, AMANECER).resultado).toBe("fallo");
  });
  it("Jezero no gana solo por pasar el tick", () => {
    let s = partidaDeMision(MISION_JEZERO, "s");
    s = avanzarTick({ ...s, tick: 3, recursos: { energia: 90, soporte_vital: 90, blindaje: 90 } });
    expect(s.resultado).toBe("en_curso");
  });
});
