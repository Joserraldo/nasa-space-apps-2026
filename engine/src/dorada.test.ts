import { describe, expect, it } from "vitest";
import type { Equipment } from "@solar-shield/contracts";
import { MODULOS, RETRASO_COMUNICACIONES } from "@solar-shield/design";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { crearPartida } from "./escenario.js";
import { partidaDorada, paso, SEMILLA_DORADA, telemetriaPendiente, tormentaActiva } from "./dorada.js";
import { resumenPartida } from "./resumen.js";

describe("semilla dorada (congelada)", () => {
  it("produce Jezero + tormenta del 20 may 2024 medida en Marte + Iris dañada", () => {
    const s = partidaDorada();
    expect(s.seed).toBe(SEMILLA_DORADA);
    expect(s.sitio).toBe("marte_jezero");
    expect(s.tormenta?.id).toBe("2024-05-20-marte");
    expect(s.tormenta?.marcoMarte).toBe("observado");
    expect(s.tormenta?.medicionMarte?.factor).toBeGreaterThan(1.5);
    expect(s.equipos.ia_base).toBe("averiado");
    expect(s.iaBase).toBe("danada");
    expect(s.tripulacion.filter((t) => t.disponible).map((t) => t.id)).toEqual(["ingeniera", "doctora", "meteorologa"]);
  });

  it("escenario inicial congelado: si cambia, avisa", () => {
    const s = partidaDorada();
    expect({
      recursos: s.recursos,
      objetivo: s.objetivo,
      dificultad: s.dificultad,
      alturaKm: s.orbita?.alturaKm,
      rngEstado: s.rngEstado,
      sesgos: s.tripulacion.map((t) => t.sesgo),
    }).toMatchInlineSnapshot(`
      {
        "alturaKm": 418,
        "dificultad": "media",
        "objetivo": "explorar",
        "recursos": {
          "blindaje": 60,
          "energia": 70,
          "soporte_vital": 80,
        },
        "rngEstado": 872707066,
        "sesgos": [
          -0.63,
          -0.48,
          -0.92,
          0.38,
          -0.68,
        ],
      }
    `);
  });

  it("la ruta dorada se juega de punta a punta con los 8 pasos del motor", () => {
    let s = partidaDorada();
    // Paso 4: dos módulos, cada uno con costo visible.
    s = paso(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
    s = paso(s, { tipo: "colocar_modulo", modulo: "escudo" });
    expect(s.equipos.panel_solar).toBe("ok");
    // Paso 5: la tormenta llega.
    while (!tormentaActiva(s)) s = paso(s);
    expect(tormentaActiva(s)).toBe(true);
    // Paso 6-7: el jugador verifica, decide y envía telemetría que tarda en llegar.
    s = paso(s, { tipo: "reparar", equipo: "ia_base" });
    expect(s.iaBase).toBe("pistas");
    s = aplicarAccion(s, { tipo: "refugiarse" });
    s = aplicarAccion(s, { tipo: "enviar_telemetria" });
    const t = telemetriaPendiente(s);
    expect(t?.ticksRestantes).toBe(RETRASO_COMUNICACIONES.marte_jezero);
    s = avanzarTick(s);
    expect(telemetriaPendiente(s)?.ticksRestantes).toBe(RETRASO_COMUNICACIONES.marte_jezero - 1);
    while (telemetriaPendiente(s)) s = paso(s);
    expect(s.causas.some((c) => c.descripcionKey === "causa.enviar_telemetria" && (c.delta ?? 0) > 0)).toBe(true);
    // Paso 8: cadena de causas.
    const r = resumenPartida(s);
    expect(r.tormentaId).toBe("2024-05-20-marte");
    expect(r.danoPorOrigen.mala_suerte).toBeGreaterThan(0);
    expect(r.danoPorOrigen.decision).toBeGreaterThan(0);
  });

  it("misma semilla dorada, mismas acciones, mismo final", () => {
    const jugar = () => {
      let s = partidaDorada();
      for (let i = 0; i < 12; i++) s = paso(s, i % 4 === 0 ? { tipo: "enviar_telemetria" } : undefined);
      return s;
    };
    expect(jugar()).toEqual(jugar());
  });
});

describe("misión de Jezero como datos", () => {
  it("cada módulo disponible mueve al menos 2 medidores (costo + beneficio) y ninguno es gratis", () => {
    for (const m of MISION_JEZERO.modulosDisponibles) {
      const s0 = crearPartida("modulos", { sitio: "marte_jezero", dificultad: "facil" });
      const s1 = aplicarAccion(s0, { tipo: "colocar_modulo", modulo: m });
      const bajaron = (["energia", "soporte_vital", "blindaje"] as const).filter((r) => s1.recursos[r] < s0.recursos[r]);
      expect(bajaron.length, m).toBeGreaterThanOrEqual(1);
      expect(Object.values(MODULOS[m]).some((d) => d > 0), m).toBe(true);
      const movidos = new Set([...bajaron, ...Object.keys(MODULOS[m])]);
      expect(movidos.size, m).toBeGreaterThanOrEqual(2);
    }
  });

  it("la misión referencia equipos, sitio y tormenta que existen", () => {
    const equipos: Equipment[] = ["panel_solar", "bateria", "reciclador_agua", "invernadero", "escudo", "antena", "ia_base"];
    for (const m of MISION_JEZERO.modulosDisponibles) expect(equipos).toContain(m);
    expect(MISION_JEZERO.pasos.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(partidaDorada().tormenta?.id).toBe(MISION_JEZERO.tormentaId);
  });

  it("la telemetría tarda más en Marte que en la Luna", () => {
    expect(RETRASO_COMUNICACIONES.marte_jezero).toBeGreaterThan(RETRASO_COMUNICACIONES.luna_polo_sur);
    const luna = aplicarAccion(crearPartida("luna", { sitio: "luna_polo_sur" }), { tipo: "enviar_telemetria" });
    expect(telemetriaPendiente(luna)?.ticksRestantes).toBe(RETRASO_COMUNICACIONES.luna_polo_sur);
  });
});
