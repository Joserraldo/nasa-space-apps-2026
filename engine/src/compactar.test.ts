import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, aterrizar, avanzarTick, consumoDeModulos, modulosColocados } from "./acciones.js";
import { compactarCausas } from "./compactar.js";
import { partidaDorada } from "./dorada.js";
import { minimoHistorico, resumenPartida } from "./resumen.js";

/** Partida larga con aterrizaje, dos módulos y muchos ticks (recursos sostenidos para que no termine). */
function partidaLarga(ticks: number): GameState {
  let s = aterrizar(partidaDorada(), MISION_JEZERO.sitiosCandidatos[0]!.id);
  s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
  s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" });
  for (let i = 0; i < ticks; i++) {
    s = avanzarTick({ ...s, pausado: false });
    if (i % 5 === 0) s = { ...s, recursos: { energia: 90, soporte_vital: 90, blindaje: 90 } };
    if (s.resultado !== "en_curso") s = { ...s, resultado: "en_curso" };
  }
  return s;
}

describe("compactarCausas (guardado sin pérdida)", () => {
  it("reduce la cadena y deja igual todo lo que el motor deriva de ella", () => {
    const s = partidaLarga(60);
    const c = compactarCausas(s);
    expect(c.causas.length).toBeLessThan(s.causas.length);
    expect(c.recursos).toEqual(s.recursos);
    expect(modulosColocados(c)).toEqual(modulosColocados(s));
    expect(consumoDeModulos(c)).toEqual(consumoDeModulos(s));
    expect(c.causas.filter((x) => x.descripcionKey === "causa.aterrizaje").length).toBeGreaterThan(0);
    expect(resumenPartida(c)).toEqual(resumenPartida(s));
    for (const r of ["energia", "soporte_vital", "blindaje"] as const) {
      expect(minimoHistorico(c, r)).toBe(minimoHistorico(s, r));
    }
  });

  it("tras restaurar una partida compactada no se vuelve a cobrar el aterrizaje ni se repiten módulos", () => {
    const c = compactarCausas(partidaLarga(60));
    expect(aterrizar(c, MISION_JEZERO.sitiosCandidatos[0]!.id)).toBe(c);
    expect(aplicarAccion(c, { tipo: "colocar_modulo", modulo: "panel_solar" })).toBe(c);
  });

  it("no fusiona a través de otra causa del mismo recurso ni mezcla signos", () => {
    const base = partidaDorada();
    const s: GameState = {
      ...base,
      causas: [
        { tick: 1, origen: "sistema", descripcionKey: "causa.consumo", recurso: "energia", delta: -2 },
        { tick: 1, origen: "sistema", descripcionKey: "causa.consumo", recurso: "soporte_vital", delta: -1 },
        { tick: 2, origen: "sistema", descripcionKey: "causa.consumo", recurso: "energia", delta: -2 },
        { tick: 2, origen: "mala_suerte", descripcionKey: "causa.tormenta", recurso: "energia", delta: -5 },
        { tick: 3, origen: "sistema", descripcionKey: "causa.consumo", recurso: "energia", delta: -2 },
        { tick: 4, origen: "sistema", descripcionKey: "causa.consumo", recurso: "energia", delta: 3 },
      ],
    };
    expect(compactarCausas(s).causas).toEqual([
      { tick: 2, origen: "sistema", descripcionKey: "causa.consumo", recurso: "energia", delta: -4 },
      { tick: 1, origen: "sistema", descripcionKey: "causa.consumo", recurso: "soporte_vital", delta: -1 },
      { tick: 2, origen: "mala_suerte", descripcionKey: "causa.tormenta", recurso: "energia", delta: -5 },
      { tick: 3, origen: "sistema", descripcionKey: "causa.consumo", recurso: "energia", delta: -2 },
      { tick: 4, origen: "sistema", descripcionKey: "causa.consumo", recurso: "energia", delta: 3 },
    ]);
  });

  it("devuelve el mismo objeto si no hay nada que fusionar", () => {
    const s = partidaDorada();
    expect(compactarCausas(s)).toBe(s);
  });
});
