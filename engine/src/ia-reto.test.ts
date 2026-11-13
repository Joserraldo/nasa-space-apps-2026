import { describe, expect, it } from "vitest";
import type { GameState, SpaceWeatherEvent } from "@solar-shield/contracts";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { crearPartida } from "./escenario.js";
import { actualizarIa, repararIa } from "./ia.js";
import { regionPorSemilla, retoDelDia, semillaDelDia } from "./reto.js";

const fuente = {
  nombreKey: "fuente.donki",
  url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  idFuente: "x",
  consultadoEl: "2026-11-13",
};
const tormenta: SpaceWeatherEvent = {
  id: "t",
  tipo: "GST",
  inicio: "2024-05-10T00:00:00Z",
  duracionHoras: 24,
  intensidad: 0.8,
  fuente,
};

function con(s: GameState, recursos: Partial<GameState["recursos"]>): GameState {
  return { ...s, recursos: { ...s.recursos, ...recursos } };
}

describe("IA de la base adaptativa (reglas, sin azar)", () => {
  it("si el niño acierta seguido, la IA se apaga antes", () => {
    let s = con(crearPartida("ok"), { energia: 90, soporte_vital: 90, blindaje: 90 });
    for (let i = 0; i < 4; i++) s = actualizarIa(s, true, 0);
    expect(s.iaBase).toBe("pistas");
    for (let i = 0; i < 4; i++) s = actualizarIa(s, true, 0);
    expect(s.iaBase).toBe("offline");
  });

  it("si se queda quieto, la IA se repara y ayuda (baja de nivel)", () => {
    let s: GameState = { ...crearPartida("quieto"), iaBase: "offline" };
    for (let i = 0; i < 3; i++) s = actualizarIa(s, false, 0);
    expect(s.iaBase).toBe("pistas");
    expect(s.causas.at(-1)?.descripcionKey).toBe("ia.baja_nivel");
  });

  it("si repite errores, baja de nivel", () => {
    let s: GameState = con({ ...crearPartida("err"), iaBase: "pistas" }, { energia: 10 });
    for (let i = 0; i < 2; i++) s = actualizarIa(s, true, 0);
    expect(s.iaBase).toBe("tutorial");
  });

  it("la radiación daña la IA cuando el blindaje es bajo; en fácil casi nunca", () => {
    const media = con(crearPartida("rad", { dificultad: "media" }), { blindaje: 15 });
    expect(actualizarIa(media, true, 0.5).iaBase).toBe("danada");
    expect(actualizarIa(media, true, 0).iaBase).not.toBe("danada");
    const facil = con(crearPartida("rad", { dificultad: "facil" }), { blindaje: 15 });
    expect(actualizarIa(facil, true, 0.5).iaBase).not.toBe("danada");
  });

  it("hardcore arranca dañada y la Ingeniera la repara", () => {
    const s = crearPartida("hc", { dificultad: "hardcore" });
    expect(s.iaBase).toBe("danada");
    const r = aplicarAccion(s, { tipo: "reparar", equipo: "ia_base" });
    expect(r.iaBase).toBe("pistas");
    expect(r.equipos.ia_base).toBe("ok");
    expect(repararIa(r)).toEqual(r);
  });

  it("en una partida real el nivel se mueve y la causa queda registrada", () => {
    let s = con(crearPartida("partida", { sitio: "marte_jezero", dificultad: "facil" }), {
      energia: 95,
      soporte_vital: 95,
      blindaje: 95,
    });
    for (let i = 0; i < 6; i++) s = avanzarTick(aplicarAccion(s, { tipo: "esperar" }));
    expect(s.causas.some((c) => c.descripcionKey.startsWith("ia."))).toBe(true);
  });
});

describe("reto del día y región por semilla", () => {
  it("misma fecha, misma partida, siempre en Jezero", () => {
    const a = retoDelDia("2026-11-14", [tormenta]);
    const b = retoDelDia("2026-11-14", [tormenta]);
    expect(a).toEqual(b);
    expect(a.sitio).toBe("marte_jezero");
    expect(a.tormenta?.id).toBe("t");
    expect(retoDelDia("2026-11-15").rngEstado).not.toBe(a.rngEstado);
  });

  it("rechaza fechas mal formadas", () => {
    expect(() => semillaDelDia("14/11/2026")).toThrow();
  });

  it("la región sale de la semilla y es reproducible", () => {
    const c = [
      { id: "a", nombreKey: "s.a", puntajes: { plano: 1, luz: 1, blindaje: 1 } },
      { id: "b", nombreKey: "s.b", puntajes: { plano: 0, luz: 0, blindaje: 0 } },
      { id: "c", nombreKey: "s.c", puntajes: { plano: 0.5, luz: 0.5, blindaje: 0.5 } },
    ];
    expect(regionPorSemilla("x", c)).toEqual(regionPorSemilla("x", c));
    const ids = new Set(["x", "y", "z", "w", "v"].map((s) => regionPorSemilla(s, c).id));
    expect(ids.size).toBeGreaterThan(1);
  });
});
