import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { aplicarAccion, avanzarTick, pausar } from "./acciones.js";
import { partidaDeMision } from "./dorada.js";

// Fixtures unitarias de frontera: no representan partidas ganadas de misiones reales.
const MISION: Mision = { ...MISION_JEZERO, fin: { ...MISION_JEZERO.fin, tickLimite: 3 } };
function frontera(tick = 0, mision = MISION): GameState {
  return { ...partidaDeMision(mision, "limite"), tick, tormenta: null,
    recursos: { energia: 90, soporte_vital: 90, blindaje: 90 } };
}

describe("fin por tick límite", () => {
  it("continúa antes del límite y falla en él si no cumplió el objetivo", () => {
    const antes = avanzarTick(frontera(1), MISION);
    expect(antes.tick).toBe(2);
    expect(antes.resultado).toBe("en_curso");
    const fin = avanzarTick(antes, MISION);
    expect(fin.tick).toBe(3);
    expect(fin.resultado).toBe("fallo");
    expect(avanzarTick(fin, MISION)).toBe(fin);
  });

  it("no deja continuar un estado heredado que ya pasó el límite", () => {
    expect(avanzarTick(frontera(4), MISION).resultado).toBe("fallo");
    const envio = aplicarAccion(frontera(1), { tipo: "enviar_telemetria" }, MISION);
    expect(avanzarTick({ ...envio, tick: 4 }, MISION).resultado).toBe("fallo");
  });

  it("la telemetría que llega exactamente en el límite sí cumple el objetivo", () => {
    let s = aplicarAccion(frontera(1), { tipo: "enviar_telemetria" }, MISION);
    s = avanzarTick(s, MISION);
    expect(s.resultado).toBe("en_curso");
    s = avanzarTick(s, MISION);
    expect(s.tick).toBe(MISION.fin.tickLimite);
    expect(s.resultado).toBe("exito");
  });

  it("recurso cero prevalece sobre telemetría y plazo coincidentes", () => {
    let s = aplicarAccion(frontera(1), { tipo: "enviar_telemetria" }, MISION);
    s = { ...s, tick: 2, recursos: { ...s.recursos, energia: 1 } };
    expect(avanzarTick(s, MISION).resultado).toBe("fallo");
  });

  it("puede sobrevivir hasta el propio límite, sin enviar telemetría", () => {
    const m: Mision = { ...MISION, fin: { ...MISION.fin, exitoCuando: { tipo: "sobrevivir_hasta_tick", tick: 3 } } };
    expect(avanzarTick(frontera(1, m), m).resultado).toBe("en_curso");
    expect(avanzarTick(frontera(2, m), m).resultado).toBe("exito");
    const agotada: Mision = { ...m, fin: { ...m.fin, exitoCuando: { tipo: "sobrevivir_hasta_tick", tick: 4 } } };
    expect(avanzarTick(frontera(2, agotada), agotada).resultado).toBe("fallo");
  });

  it("no convierte el día 30 en una victoria ajena al objetivo de misión", () => {
    const m: Mision = { ...MISION, fin: { ...MISION.fin, tickLimite: 40 } };
    const s = avanzarTick(frontera(29, m), m);
    expect(s.tick).toBe(30);
    expect(s.resultado).toBe("en_curso");
  });

  it("la pausa y los estados terminales conservan el mismo objeto sin avanzar", () => {
    const pausa = pausar(frontera(3), true);
    expect(avanzarTick(pausa, MISION)).toBe(pausa);
    for (const resultado of ["exito", "fallo"] as const) {
      const terminal = { ...frontera(3), resultado };
      expect(avanzarTick(terminal, MISION)).toBe(terminal);
      expect(aplicarAccion(terminal, { tipo: "esperar" }, MISION)).toBe(terminal);
    }
  });
});
