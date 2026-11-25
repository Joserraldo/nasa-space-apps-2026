/**
 * QA-445: la derrota por radiación tiene causa propia (`causa.limite_radiacion`) y la pantalla
 * final debe poder decir por qué terminó la partida. Además, el daño de la tormenta no puede
 * ocultar todas las decisiones del niño en las causas destacadas.
 * Los valores esperados se calculan con el motor, nunca con números a mano.
 */
import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { CAUSAS_DESTACADAS } from "@solar-shield/design";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aterrizar, avanzarTick, aplicarAccion } from "./acciones.js";
import { elegirDilema } from "./dilema.js";
import { partidaDorada, paso } from "./dorada.js";
import { resumenPartida } from "./resumen.js";

function hastaElFinal(s: GameState): GameState {
  let n = 0;
  while (s.resultado === "en_curso" && n < 50) {
    s = avanzarTick(s, MISION_JEZERO);
    n++;
  }
  return s;
}

/** Ruta de la prueba 1: sitio medio, dos módulos, tormenta, dilema "aguantar" y telemetría. */
function derrotaPorRadiacion(): GameState {
  let s = partidaDorada();
  s = aterrizar(s, "cerca-de-perseverance", MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "panel_solar" }, MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "escudo" }, MISION_JEZERO);
  s = paso(s, undefined, MISION_JEZERO);
  s = elegirDilema(s, "aguantar", MISION_JEZERO);
  s = avanzarTick(s, MISION_JEZERO);
  s = aplicarAccion(s, { tipo: "enviar_telemetria" }, MISION_JEZERO);
  return hastaElFinal(s);
}

/** Misma ruta, pero el dilema protege a la tripulación en el refugio. */
function victoria(): GameState {
  let s = partidaDorada();
  s = aterrizar(s, "cerca-de-perseverance", MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "panel_solar" }, MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "escudo" }, MISION_JEZERO);
  s = paso(s, undefined, MISION_JEZERO);
  s = elegirDilema(s, "refugio_y_apagar_invernadero", MISION_JEZERO);
  s = avanzarTick(s, MISION_JEZERO);
  s = aplicarAccion(s, { tipo: "enviar_telemetria" }, MISION_JEZERO);
  return hastaElFinal(s);
}

describe("QA-445 causa terminal y decisiones en el resumen", () => {
  it("la derrota por radiación deja causaTerminal con causa.limite_radiacion", () => {
    const s = derrotaPorRadiacion();
    expect(s.resultado).toBe("fallo");
    const r = resumenPartida(s);
    expect(r.causaTerminal?.descripcionKey).toBe("causa.limite_radiacion");
    expect(r.causaTerminal?.origen).toBe("sistema");
  });

  it("la causa terminal no cuenta como daño por origen ni por recurso", () => {
    const s = derrotaPorRadiacion();
    const r = resumenPartida(s);

    // Solo las causas con recurso y delta negativo suman daño.
    const esperado = { decision: 0, mala_suerte: 0, sistema: 0 };
    for (const c of s.causas) {
      if (!c.recurso || c.delta === undefined || c.delta >= 0) continue;
      esperado[c.origen] += -c.delta;
    }
    expect(r.danoPorOrigen).toEqual(esperado);
    expect(r.causaTerminal?.recurso).toBeUndefined();
    expect(r.causaTerminal?.delta).toBeUndefined();
  });

  it("en la victoria no hay causa terminal", () => {
    const s = victoria();
    expect(s.resultado).toBe("exito");
    expect(resumenPartida(s).causaTerminal).toBeNull();
  });

  it("una derrota por recurso a cero explica el recurso, nunca la radiación", () => {
    // Derrota real del motor por recurso a cero: energía 1 y sin tormenta (el consumo pasivo la deja en 0 en el tick 1).
    const inicial = partidaDorada();
    const sinTormentaYConPocaEnergia: GameState = {
      ...inicial,
      tormenta: null,
      recursos: { ...inicial.recursos, energia: 1 },
    };
    const s = hastaElFinal(sinTormentaYConPocaEnergia);

    expect(s.resultado).toBe("fallo");
    expect(s.recursos.energia).toBe(0);
    expect(s.causas.some((c) => c.descripcionKey === "causa.limite_radiacion")).toBe(false);
    const r = resumenPartida(s);
    expect(r.causaTerminal?.descripcionKey).toBe("causa.recurso_agotado.energia");
    // El motivo es solo para la pantalla: no se añade al registro ni suma daño.
    expect(s.causas.some((c) => c.descripcionKey.startsWith("causa.recurso_agotado"))).toBe(false);
    expect(r.causaTerminal?.delta).toBeUndefined();
  });

  it("si en el mismo turno hay recurso a cero y radiación alta, manda el recurso (como en el motor)", () => {
    const s: GameState = {
      ...partidaDorada(),
      resultado: "fallo",
      recursos: { energia: 20, soporte_vital: 0, blindaje: 30 },
      causas: [{ tick: 5, origen: "sistema", descripcionKey: "causa.limite_radiacion" }],
    };
    expect(resumenPartida(s).causaTerminal?.descripcionKey).toBe("causa.recurso_agotado.soporte_vital");
  });

  it("una derrota por plazo, con recursos y dosis bien, dice que se acabó el tiempo", () => {
    const s: GameState = { ...partidaDorada(), resultado: "fallo", tick: MISION_JEZERO.fin.tickLimite };
    expect(Object.values(s.recursos).every((v) => v > 0)).toBe(true);
    expect(resumenPartida(s).causaTerminal?.descripcionKey).toBe("causa.plazo_agotado");
  });

  it("una partida en curso no tiene causa terminal", () => {
    expect(resumenPartida(partidaDorada()).causaTerminal).toBeNull();
  });

  it("si el daño de la tormenta tapa las decisiones, la última destacada cede su lugar", () => {
    const base = partidaDorada();
    const s: GameState = {
      ...base,
      causas: [
        { tick: 1, origen: "mala_suerte", descripcionKey: "mala_suerte.micrometeorito", recurso: "blindaje", delta: -10 },
        { tick: 2, origen: "mala_suerte", descripcionKey: "mala_suerte.fallo_panel", recurso: "energia", delta: -10 },
        { tick: 3, origen: "mala_suerte", descripcionKey: "mala_suerte.fuga_agua", recurso: "soporte_vital", delta: -9 },
        { tick: 4, origen: "decision", descripcionKey: "causa.esperar", recurso: "blindaje", delta: -5 },
      ],
    };

    const { causasDestacadas } = resumenPartida(s);
    expect(causasDestacadas).toHaveLength(Math.min(CAUSAS_DESTACADAS, s.causas.length));
    expect(causasDestacadas.some((c) => c.origen === "decision")).toBe(true);
    for (let i = 1; i < causasDestacadas.length; i++) {
      expect(causasDestacadas[i]!.delta!).toBeGreaterThanOrEqual(causasDestacadas[i - 1]!.delta!);
    }
    expect(causasDestacadas.every((c) => c.origen !== "sistema")).toBe(true);
  });

  it("si ya hay una decisión entre las tres de mayor daño, no se sustituye nada", () => {
    const base = partidaDorada();
    const s: GameState = {
      ...base,
      causas: [
        { tick: 1, origen: "mala_suerte", descripcionKey: "mala_suerte.micrometeorito", recurso: "blindaje", delta: -10 },
        { tick: 2, origen: "mala_suerte", descripcionKey: "mala_suerte.fallo_panel", recurso: "energia", delta: -3 },
        { tick: 3, origen: "mala_suerte", descripcionKey: "mala_suerte.fuga_agua", recurso: "soporte_vital", delta: -2 },
        { tick: 4, origen: "decision", descripcionKey: "causa.esperar", recurso: "blindaje", delta: -9 },
      ],
    };

    // Cálculo anterior (sin la regla de no ocultar decisiones), para comparar.
    const anterior = s.causas
      .filter((c) => c.delta !== undefined && c.delta < 0 && c.origen !== "sistema")
      .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0) || a.tick - b.tick)
      .slice(0, CAUSAS_DESTACADAS);

    expect(resumenPartida(s).causasDestacadas).toEqual(anterior);
  });
});
