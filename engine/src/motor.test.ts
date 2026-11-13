import { describe, expect, it } from "vitest";
import { type BaseAction, type GameState } from "@solar-shield/contracts";
import { COSTOS_ACCION } from "@solar-shield/design";
import { aplicarAccion, avanzarTick, pausar, queEsSi } from "./acciones.js";
import { crearPartida } from "./escenario.js";

const ACCIONES: BaseAction[] = [
  { tipo: "esperar" },
  { tipo: "redistribuir_energia", hacia: "blindaje", cantidad: 10 },
  { tipo: "reparar", equipo: "panel_solar" },
  { tipo: "subir_escudo", nivel: 2 },
  { tipo: "refugiarse" },
  { tipo: "salida_exterior", objetivo: "antena" },
  { tipo: "ajustar_orbita", deltaAlturaKm: 20 },
];

function jugar(seed: string, acciones: BaseAction[]): GameState {
  let s = crearPartida(seed, { sitio: "marte_jezero", dificultad: "media" });
  for (const a of acciones) {
    s = aplicarAccion(s, a);
    s = avanzarTick(s);
  }
  return s;
}

describe("determinismo", () => {
  it("misma semilla + mismas acciones = mismo estado", () => {
    expect(jugar("dorada", ACCIONES)).toEqual(jugar("dorada", ACCIONES));
  });
  it("semillas distintas producen escenarios distintos", () => {
    const a = crearPartida("alfa");
    const b = crearPartida("beta");
    expect([a.sitio, a.objetivo, a.rngEstado]).not.toEqual([b.sitio, b.objetivo, b.rngEstado]);
  });
  it("crearPartida no toca el reloj ni Math.random (estado serializable y estable)", () => {
    expect(JSON.stringify(crearPartida("x"))).toBe(JSON.stringify(crearPartida("x")));
  });
});

describe("regla de oro: ninguna acción es gratis", () => {
  for (const [tipo, costo] of Object.entries(COSTOS_ACCION)) {
    it(`${tipo} mueve al menos dos medidores, uno sube y otro baja`, () => {
      const bajan = Object.values(costo.inmediato).filter((d) => d < 0).length;
      const suben = Object.values(costo.retrasado).filter((d) => d > 0).length;
      // redistribuir_energia sube por parámetro; se cubre en el test de abajo.
      if (tipo !== "redistribuir_energia") expect(suben).toBeGreaterThanOrEqual(1);
      expect(bajan).toBeGreaterThanOrEqual(1);
    });
  }

  it("cada acción aplicada cambia al menos dos recursos tras su retraso", () => {
    for (const a of ACCIONES) {
      const antes = crearPartida("costo", { sitio: "marte_jezero", dificultad: "facil" });
      // Aislamos la acción: quitamos consumo pasivo comparando contra "esperar sin acción".
      const conAccion = queEsSi(antes, a);
      const sinAccion = avanzarTick(antes);
      const movidos = (["energia", "soporte_vital", "blindaje"] as const).filter(
        (r) => conAccion.recursos[r] !== sinAccion.recursos[r],
      );
      expect(movidos.length, a.tipo).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("cola de efectos con retraso", () => {
  it("el costo es inmediato y el beneficio llega entre 1 y 3 ticks después", () => {
    const s0 = crearPartida("retraso", { sitio: "marte_jezero", dificultad: "dificil" });
    const s1 = aplicarAccion(s0, { tipo: "subir_escudo", nivel: 1 });
    expect(s1.recursos.energia).toBeLessThan(s0.recursos.energia);
    expect(s1.recursos.blindaje).toBe(s0.recursos.blindaje);
    expect(s1.efectosPendientes).toHaveLength(1);
    const e = s1.efectosPendientes[0]!;
    expect(e.aplicaEnTick - s1.tick).toBeGreaterThanOrEqual(2);
    expect(e.aplicaEnTick - s1.tick).toBeLessThanOrEqual(3);
  });

  it("en hardcore los efectos son ocultos", () => {
    const s = aplicarAccion(crearPartida("h", { dificultad: "hardcore" }), { tipo: "refugiarse" });
    expect(s.efectosPendientes.every((e) => e.oculto)).toBe(true);
  });
});

describe("registro de causas", () => {
  it("distingue decisión, mala suerte y sistema", () => {
    const s = jugar("causas", ACCIONES);
    const origenes = new Set(s.causas.map((c) => c.origen));
    expect(origenes.has("decision")).toBe(true);
    expect(origenes.has("sistema")).toBe(true);
    expect(s.causas.every((c) => c.descripcionKey.includes("."))).toBe(true); // claves i18n, no texto
  });
});

describe("reloj", () => {
  it("en pausa no avanza", () => {
    const s = pausar(crearPartida("p"), true);
    expect(avanzarTick(s)).toEqual(s);
  });
  it("simular no cambia recursos y consume un uso", () => {
    const s0 = crearPartida("sim", { dificultad: "dificil" });
    const s1 = aplicarAccion(s0, { tipo: "simular", accion: { tipo: "refugiarse" } });
    expect(s1.recursos).toEqual(s0.recursos);
    expect(s1.simulacionesRestantes).toBe((s0.simulacionesRestantes ?? 0) - 1);
  });
  it("la semilla dorada corre de punta a punta hasta un resultado", () => {
    let s = crearPartida("2026-11-14", { sitio: "marte_jezero", dificultad: "facil" });
    let n = 0;
    while (s.resultado === "en_curso" && n < 200) {
      s = aplicarAccion(s, n % 3 === 0 ? { tipo: "salida_exterior", objetivo: "panel_solar" } : { tipo: "esperar" });
      s = avanzarTick(s);
      n++;
    }
    expect(["exito", "fallo"]).toContain(s.resultado);
  });
});
