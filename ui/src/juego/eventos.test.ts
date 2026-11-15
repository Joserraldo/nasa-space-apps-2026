import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { avanzarTick, partidaDorada } from "@solar-shield/engine";
import { eventosDeTick } from "./eventos";

function hastaTormenta(): [GameState, GameState] {
  let antes = partidaDorada();
  for (let i = 0; i < 20; i++) {
    const despues = avanzarTick(antes);
    if (eventosDeTick(antes, despues).some((e) => e.tipo === "tormenta_llego")) return [antes, despues];
    antes = despues;
  }
  throw new Error("la tormenta no llegó en 20 ticks");
}

describe("eventosDeTick", () => {
  it("sin cambios no hay eventos", () => {
    const e = partidaDorada();
    expect(eventosDeTick(e, e)).toEqual([]);
  });

  it("un tick deja deltas de recursos que cuadran con el estado", () => {
    const antes = partidaDorada();
    const despues = avanzarTick(antes);
    const deltas = eventosDeTick(antes, despues).filter((e) => e.tipo === "recurso");
    expect(deltas.length).toBeGreaterThan(0);
    for (const d of deltas) {
      if (d.tipo !== "recurso") continue;
      expect(d.delta).toBeCloseTo(despues.recursos[d.recurso] - antes.recursos[d.recurso]);
    }
  });

  it("los ids son estables y únicos", () => {
    const [antes, despues] = hastaTormenta();
    const a = eventosDeTick(antes, despues).map((e) => e.id);
    expect(eventosDeTick(antes, despues).map((e) => e.id)).toEqual(a);
    expect(new Set(a).size).toBe(a.length);
  });

  it("anuncia la tormenta una sola vez", () => {
    const [, despues] = hastaTormenta();
    const siguiente = avanzarTick(despues);
    expect(eventosDeTick(despues, siguiente).some((e) => e.tipo === "tormenta_llego")).toBe(false);
  });

  it("avisa el fin de la partida", () => {
    const antes = partidaDorada();
    const fin = eventosDeTick(antes, { ...antes, resultado: "fallo" });
    expect(fin).toContainEqual({ id: `t${antes.tick}-fin`, tipo: "fin", resultado: "fallo" });
  });
});
