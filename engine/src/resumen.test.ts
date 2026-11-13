import { describe, expect, it } from "vitest";
import type { GameState, SpaceWeatherEvent } from "@solar-shield/contracts";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { crearPartida } from "./escenario.js";
import { minimoHistorico, resumenPartida } from "./resumen.js";

const fuente = {
  nombreKey: "fuente.donki",
  url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  idFuente: "x",
  consultadoEl: "2026-11-13",
};
const tormenta: SpaceWeatherEvent = {
  id: "2024-05-20-marte",
  tipo: "CME",
  inicio: "2024-05-20T05:36:00Z",
  duracionHoras: 72,
  intensidad: 0.4,
  fuente,
};

function jugarHastaElFinal(s: GameState, max = 300): GameState {
  let n = 0;
  while (s.resultado === "en_curso" && n < max) {
    s = avanzarTick(aplicarAccion(s, n % 2 === 0 ? { tipo: "esperar" } : { tipo: "salida_exterior", objetivo: "panel_solar" }));
    n++;
  }
  return s;
}

describe("resumen de partida (cadena de causas)", () => {
  it("separa el daño por origen y lo desglosa por recurso", () => {
    const s = jugarHastaElFinal(crearPartida("resumen", { sitio: "marte_jezero", dificultad: "media", tormentas: [tormenta] }));
    const r = resumenPartida(s);
    expect(["exito", "fallo"]).toContain(r.resultado);
    expect(r.danoPorOrigen.decision).toBeGreaterThan(0);
    expect(r.danoPorOrigen.sistema).toBeGreaterThan(0); // consumo pasivo
    const sumaRecursos = (["energia", "soporte_vital", "blindaje"] as const).reduce(
      (acc, k) => acc + r.porRecurso[k].decision + r.porRecurso[k].mala_suerte + r.porRecurso[k].sistema,
      0,
    );
    expect(sumaRecursos).toBe(r.danoPorOrigen.decision + r.danoPorOrigen.mala_suerte + r.danoPorOrigen.sistema);
    expect(r.pctDecision).toBeGreaterThanOrEqual(0);
    expect(r.pctDecision).toBeLessThanOrEqual(100);
    expect(r.tormentaId).toBe("2024-05-20-marte");
  });

  it("las causas destacadas son las de mayor daño y nunca del sistema", () => {
    const s = jugarHastaElFinal(crearPartida("destacadas", { sitio: "marte_jezero", dificultad: "dificil" }));
    const r = resumenPartida(s);
    expect(r.causasDestacadas.length).toBeLessThanOrEqual(3);
    for (const c of r.causasDestacadas) {
      expect(c.origen).not.toBe("sistema");
      expect(c.delta ?? 0).toBeLessThan(0);
    }
    for (let i = 1; i < r.causasDestacadas.length; i++) {
      expect(r.causasDestacadas[i]!.delta!).toBeGreaterThanOrEqual(r.causasDestacadas[i - 1]!.delta!);
    }
  });

  it("puntaje y rango: éxito con recursos altos da comandante; fallo con todo en cero da aprendiz", () => {
    const base = crearPartida("rango");
    const bueno = resumenPartida({ ...base, resultado: "exito", recursos: { energia: 90, soporte_vital: 90, blindaje: 90 } });
    expect(bueno.puntaje).toBe(95);
    expect(bueno.rangoKey).toBe("rango.comandante");
    const malo = resumenPartida({ ...base, resultado: "fallo", recursos: { energia: 0, soporte_vital: 0, blindaje: 0 } });
    expect(malo.puntaje).toBe(0);
    expect(malo.rangoKey).toBe("rango.aprendiz");
  });

  it("insignias por reglas: equilibrio, cálculo y mecánica", () => {
    let s = crearPartida("insignias", { dificultad: "hardcore" });
    s = aplicarAccion(s, { tipo: "simular", accion: { tipo: "refugiarse" } });
    s = aplicarAccion(s, { tipo: "reparar", equipo: "ia_base" });
    const r = resumenPartida({ ...s, recursos: { energia: 60, soporte_vital: 60, blindaje: 60 } });
    expect(r.insigniasKeys).toContain("insignia.equilibrio");
    expect(r.insigniasKeys).toContain("insignia.calculo");
    expect(r.insigniasKeys).toContain("insignia.mecanica");
    expect(r.insigniasKeys).not.toContain("insignia.autonomia");
  });

  it("minimoHistorico reconstruye el valor más bajo desde las causas", () => {
    const s0 = crearPartida("minimo", { sitio: "marte_jezero", dificultad: "facil" });
    let s = s0;
    let minimoReal = s0.recursos.blindaje;
    for (let i = 0; i < 8; i++) {
      s = avanzarTick(aplicarAccion(s, { tipo: "salida_exterior", objetivo: "antena" }));
      minimoReal = Math.min(minimoReal, s.recursos.blindaje);
    }
    expect(minimoHistorico(s, "blindaje")).toBeLessThanOrEqual(minimoReal);
  });

  it("es determinista: misma partida, mismo resumen", () => {
    const a = resumenPartida(jugarHastaElFinal(crearPartida("det", { sitio: "marte_jezero" })));
    const b = resumenPartida(jugarHastaElFinal(crearPartida("det", { sitio: "marte_jezero" })));
    expect(a).toEqual(b);
  });
});
