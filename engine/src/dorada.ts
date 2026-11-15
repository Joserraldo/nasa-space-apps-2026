import type { Action, GameState, PendingEffect, SpaceWeatherEvent } from "@solar-shield/contracts";
import { eventosCurados } from "@solar-shield/data";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
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
  return partidaDeMision(MISION_JEZERO, SEMILLA_DORADA);
}

/**
 * Estado inicial de cualquier misión (#152). Sitio, dificultad, avería, objetivo y tormenta
 * (`mision.tormentaId`, buscada en el catálogo curado de data/) salen de la misión.
 * Misma misión + misma semilla => misma partida. Si la tormenta no está en el catálogo, falla fuerte.
 * `partidaDorada()` es esto con Jezero y SEMILLA_DORADA.
 */
export function partidaDeMision(mision: Mision, semilla: string = SEMILLA_DORADA): GameState {
  const tormenta = eventosCurados.find((e) => e.id === mision.tormentaId) as SpaceWeatherEvent | undefined;
  if (!tormenta) throw new Error(`partidaDeMision: la tormenta "${mision.tormentaId}" no está en el catálogo curado`);
  const s = crearPartida(semilla, {
    sitio: mision.sitio,
    dificultad: mision.dificultad,
    tormentas: [tormenta],
    averiaInicial: mision.averiaInicial,
    iaInicial: "danada",
  });
  return { ...s, objetivo: mision.objetivo };
}

/** ¿Ya llegó la tormenta al juego? ui pausa y muestra la tarjeta de fuente cuando pasa a true. */
export function tormentaActiva(estado: GameState, mision: Mision = MISION_JEZERO): boolean {
  return estado.tormenta !== null && estado.tick >= mision.tickTormenta;
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
export function paso(estado: GameState, accion?: Action, mision: Mision = MISION_JEZERO): GameState {
  const s = accion ? aplicarAccion(estado, accion, mision) : estado;
  return avanzarTick(s, mision);
}
