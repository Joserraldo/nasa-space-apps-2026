import type { Action, GameState, PendingEffect, SpaceWeatherEvent } from "@solar-shield/contracts";
import { eventoRutaDorada } from "@solar-shield/data";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { crearPartida } from "./escenario.js";

/**
 * Semilla dorada: la partida de demo (issue #41). Está congelada por test: si cambia
 * cualquier número del escenario inicial, el test `dorada.test.ts` lo avisa.
 */
export const SEMILLA_DORADA = "jezero-2024-05-20";

/**
 * Función única para ui: estado inicial de la ruta dorada.
 * Jezero + tormenta real del 20 may 2024 (medida en Marte por RAD) + Iris dañada.
 * La tormenta entra en el estado desde el tick 0; ui la "revela" en el paso 5 (tickTormenta).
 */
export function partidaDorada(): GameState {
  const tormenta = eventoRutaDorada as SpaceWeatherEvent;
  const s = crearPartida(SEMILLA_DORADA, {
    sitio: MISION_JEZERO.sitio,
    dificultad: MISION_JEZERO.dificultad,
    tormentas: [tormenta],
    averiaInicial: MISION_JEZERO.averiaInicial,
    iaInicial: "danada",
  });
  return { ...s, objetivo: MISION_JEZERO.objetivo };
}

/** ¿Ya llegó la tormenta al juego? ui pausa y muestra la tarjeta de fuente cuando pasa a true. */
export function tormentaActiva(estado: GameState): boolean {
  return estado.tormenta !== null && estado.tick >= MISION_JEZERO.tickTormenta;
}

/** Telemetría en camino (paso 7): null si no hay ninguna pendiente. */
export function telemetriaPendiente(estado: GameState): { llegaEnTick: number; ticksRestantes: number } | null {
  const e: PendingEffect | undefined = estado.efectosPendientes.find((p) => p.descripcionKey === "causa.enviar_telemetria");
  if (!e) return null;
  return { llegaEnTick: e.aplicaEnTick, ticksRestantes: Math.max(0, e.aplicaEnTick - estado.tick) };
}

/**
 * Un paso de juego para ui: aplica la acción (si hay) y avanza un tick.
 * Ejemplo:
 *   let s = partidaDorada();
 *   s = paso(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
 *   s = paso(s);                       // solo avanza el reloj
 *   s = paso(s, { tipo: "refugiarse" });
 */
export function paso(estado: GameState, accion?: Action): GameState {
  const s = accion ? aplicarAccion(estado, accion) : estado;
  return avanzarTick(s);
}
