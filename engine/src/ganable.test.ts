/**
 * #113: la ruta dorada se puede ganar y se puede perder por una causa explicable.
 * Secuencias de Camilo (#114), aprobadas por Santiago: semilla dorada, llanura-central,
 * panel solar y escudo en el tick 0; la tormenta hace daño en los ticks 3, 4 y 5.
 * Sin tocar recursos a mano ni forzar el resultado: solo la API pública del motor.
 */
import { describe, expect, it } from "vitest";
import type { Action, GameState } from "@solar-shield/contracts";
import { DURACION_TORMENTA_TICKS, RETRASO_COMUNICACIONES } from "@solar-shield/design";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, aplicarOpcionDilema, aterrizar, avanzarTick, modulosColocados, puedeAplicar } from "./acciones.js";
import { partidaDorada, telemetriaPendiente } from "./dorada.js";

const r = (s: GameState) => `${s.recursos.energia}/${s.recursos.soporte_vital}/${s.recursos.blindaje}`;

/** Aterriza, coloca panel y escudo en el tick 0 y avanza hasta la pausa del tick 3. */
function hastaLaTormenta(): GameState {
  let s = aterrizar(partidaDorada(), "llanura-central");
  s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
  s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" });
  while (s.tick < MISION_JEZERO.tickTormenta) s = avanzarTick(s);
  return s;
}

function jugar(enTormenta: Action, tickEnvio: number): GameState {
  let s = hastaLaTormenta();
  s = aplicarAccion(s, { tipo: "reparar", equipo: "ia_base" });
  s = aplicarAccion(s, enTormenta);
  while (s.resultado === "en_curso" && s.tick < 20) {
    if (s.tick === tickEnvio) s = aplicarAccion(s, { tipo: "enviar_telemetria" });
    s = avanzarTick(s);
  }
  return s;
}

describe("ruta dorada ganable (#113, #114)", () => {
  it("el aterrizaje y los dos módulos dejan 55/74/52 (costos de la misión)", () => {
    let s = aterrizar(partidaDorada(), "llanura-central");
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" });
    expect(r(s)).toBe("55/74/52");
  });

  it("GANA: refugio + reparar a Iris en el tick 3 y telemetría en el 4", () => {
    const s = jugar({ tipo: "refugiarse" }, 4);
    expect(s.resultado).toBe("exito");
    expect(s.tick).toBe(4 + RETRASO_COMUNICACIONES.marte_jezero);
    expect(Object.values(s.recursos).every((v) => v > 0)).toBe(true);
  });

  it("PIERDE por energía: escudo nivel 2 en el tick 3 y telemetría tarde, en el 5", () => {
    const s = jugar({ tipo: "subir_escudo", nivel: 2 }, 5);
    expect(s.resultado).toBe("fallo");
    expect(s.recursos.energia).toBe(0);
    // la causa que más pesó en energía fue una decisión, no la mala suerte
    const energiaPorDecision = s.causas.filter((c) => c.recurso === "energia" && c.origen === "decision" && (c.delta ?? 0) < 0).reduce((a, c) => a + (c.delta ?? 0), 0);
    expect(energiaPorDecision).toBeLessThan(0);
  });

  it("la tormenta solo hace daño en los ticks 3, 4 y 5", () => {
    const s = jugar({ tipo: "refugiarse" }, 4);
    const ticks = [...new Set(s.causas.filter((c) => c.descripcionKey === "causa.tormenta").map((c) => c.tick))];
    const inicio = MISION_JEZERO.tickTormenta;
    expect(ticks).toEqual(Array.from({ length: DURACION_TORMENTA_TICKS }, (_, i) => inicio + i).filter((t) => t <= s.tick));
  });

  it("la telemetría llega 2 ticks después de enviarla", () => {
    let s = hastaLaTormenta();
    s = aplicarAccion(s, { tipo: "enviar_telemetria" });
    expect(telemetriaPendiente(s)?.llegaEnTick).toBe(s.tick + RETRASO_COMUNICACIONES.marte_jezero);
  });

  it("misma semilla y mismas acciones, mismo estado completo", () => {
    expect(jugar({ tipo: "refugiarse" }, 4)).toEqual(jugar({ tipo: "refugiarse" }, 4));
  });
});

describe("reglas del motor que pidió ui (#113)", () => {
  it("el costo de aterrizaje se cobra una sola vez y un sitio desconocido no hace nada", () => {
    const s1 = aterrizar(partidaDorada(), "llanura-central");
    expect(aterrizar(s1, "llanura-central")).toBe(s1);
    expect(aterrizar(s1, "pie-de-la-pared-sur")).toBe(s1);
    const s0 = partidaDorada();
    expect(aterrizar(s0, "no-existe")).toBe(s0);
  });

  it("colocar_modulo: solo módulos de la misión, sin repetir, máximo dos", () => {
    let s = partidaDorada();
    const ajeno = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "bateria" });
    expect(ajeno).toBe(s); // la batería no está en la misión de Jezero
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
    expect(aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" })).toBe(s); // doble clic
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" });
    expect(aplicarAccion(s, { tipo: "colocar_modulo", modulo: "antena" })).toBe(s); // tercero
    expect(modulosColocados(s).sort()).toEqual(["escudo", "panel_solar"]);
  });
});

describe("rechazo limpio y dilema del paso 6 (pedido de ui)", () => {
  it("puedeAplicar dice por qué no: recursos, módulo o partida terminada; aplicarAccion no cambia nada", () => {
    const base = partidaDorada();
    expect(puedeAplicar(base, { tipo: "refugiarse" })).toEqual({ ok: true });
    const pobre: GameState = { ...base, recursos: { ...base.recursos, energia: 8 } };
    expect(puedeAplicar(pobre, { tipo: "reparar", equipo: "ia_base" })).toEqual({ ok: false, motivo: "recursos_insuficientes", recurso: "energia" });
    expect(aplicarAccion(pobre, { tipo: "reparar", equipo: "ia_base" })).toBe(pobre);
    expect(puedeAplicar(pobre, { tipo: "refugiarse" }).ok).toBe(true); // cuesta 3 de energía: sí alcanza
    expect(puedeAplicar(base, { tipo: "colocar_modulo", modulo: "bateria" })).toEqual({ ok: false, motivo: "modulo_no_permitido" });
    expect(puedeAplicar({ ...base, resultado: "fallo" }, { tipo: "esperar" })).toEqual({ ok: false, motivo: "partida_terminada" });
  });

  it("refugio con invernadero construido: se apaga y quita 10 de soporte vital con retraso", () => {
    let s = aterrizar(partidaDorada(), "llanura-central");
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "invernadero" });
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" });
    const despues = aplicarOpcionDilema(s, "refugio_y_apagar_invernadero");
    const extra = despues.efectosPendientes.filter((e) => e.descripcionKey === "causa.apagar_invernadero");
    expect(extra.map((e) => [e.recurso, e.delta])).toEqual([["soporte_vital", -10]]);
    expect(despues.recursos).toEqual(aplicarAccion(s, { tipo: "refugiarse" }).recursos);
  });

  it("refugio sin invernadero es igual a refugiarse; las otras opciones son su acción; id desconocido no hace nada", () => {
    const s = hastaLaTormenta(); // panel + escudo
    expect(aplicarOpcionDilema(s, "refugio_y_apagar_invernadero")).toEqual(aplicarAccion(s, { tipo: "refugiarse" }));
    expect(aplicarOpcionDilema(s, "subir_escudo")).toEqual(aplicarAccion(s, { tipo: "subir_escudo", nivel: 2 }));
    expect(aplicarOpcionDilema(s, "aguantar")).toEqual(aplicarAccion(s, { tipo: "esperar" }));
    expect(aplicarOpcionDilema(s, "no-existe")).toBe(s);
  });
});
