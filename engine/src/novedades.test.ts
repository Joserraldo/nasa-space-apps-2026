import { describe, expect, it } from "vitest";
import { eventosCurados } from "@solar-shield/data";
import { aplicarAccion, avanzarTick, pausar } from "./acciones.js";
import { crearPartida } from "./escenario.js";
import { partidaDorada, paso, tormentaActiva } from "./dorada.js";
import { conPausaAutomatica, novedades } from "./novedades.js";
import { retoDelDia } from "./reto.js";

describe("novedades entre ticks (para la pausa automática de ui)", () => {
  it("detecta la llegada de la tormenta en la ruta dorada y pide pausa", () => {
    let s = partidaDorada();
    let n = novedades(s, s);
    expect(n.pausar).toBe(false);
    while (!tormentaActiva(s)) {
      const sig = paso(s);
      n = novedades(s, sig);
      s = sig;
    }
    expect(n.tormentaLlego).toBe(true);
    expect(n.pausar).toBe(true);
  });

  it("los beneficios con retraso aparecen como efectosLlegaron cuando entran", () => {
    let s = crearPartida("efectos", { sitio: "marte_jezero", dificultad: "facil" });
    s = aplicarAccion(s, { tipo: "subir_escudo", nivel: 2 });
    const sig = avanzarTick(s); // en fácil el retraso es 1 tick
    const n = novedades(s, sig);
    expect(n.efectosLlegaron.some((c) => c.descripcionKey === "causa.subir_escudo" && c.recurso === "blindaje")).toBe(true);
    expect(n.causasNuevas.length).toBeGreaterThan(0);
  });

  it("reparar o colocar un módulo no dispara pausa; que la IA cambie o termine la partida sí", () => {
    const s0 = crearPartida("ia", { dificultad: "hardcore" });
    const s1 = aplicarAccion(s0, { tipo: "colocar_modulo", modulo: "panel_solar" });
    expect(novedades(s0, s1).pausar).toBe(false);
    const s2 = aplicarAccion(s1, { tipo: "reparar", equipo: "ia_base" });
    expect(novedades(s1, s2).iaCambio).toEqual({ de: "danada", a: "pistas" });
    const fin = { ...s2, resultado: "fallo" as const };
    expect(novedades(s2, fin).termino).toBe("fallo");
    expect(novedades(s2, fin).pausar).toBe(true);
  });

  it("conPausaAutomatica deja el estado pausado solo cuando hay novedad; reanudar es explícito", () => {
    let s = partidaDorada();
    let pausas = 0;
    for (let i = 0; i < 12 && s.resultado === "en_curso"; i++) {
      const sig = conPausaAutomatica(s, paso(s));
      if (sig.pausado) {
        pausas++;
        s = pausar(sig, false);
      } else s = sig;
    }
    expect(pausas).toBeGreaterThan(0); // al menos la tormenta
  });
});

describe("reto del día con el catálogo curado", () => {
  it("sin pasar tormentas, usa las curadas de data/ y es reproducible", () => {
    const a = retoDelDia("2026-11-15");
    const b = retoDelDia("2026-11-15");
    expect(a).toEqual(b);
    expect(a.tormenta).not.toBeNull();
    expect(eventosCurados.map((e) => e.id)).toContain(a.tormenta!.id);
    expect(a.tormenta!.fuente.estadoDato).toBe("curado");
  });
});
