import { guiaIrisLugar, type GuiaLugar } from "@solar-shield/agents";
import type { BaseAction, Expert, GameState } from "@solar-shield/contracts";
import { telemetriaPendiente, tormentaActiva } from "@solar-shield/engine";
import { lugar } from "../escena/mundo.js";
import type { LugarObjetivo } from "../escena/vista.js";
import type { Vars } from "../i18n.js";

/**
 * Objetivo del momento y "usar" en un lugar de la base (E6, HUD de `mundo/01`, ESCENAS §3.1–§3.5).
 * Puro: lo usan el HUD (texto bajo las placas), la escena (`lugarObjetivo`) y el botón de acción `[E]`.
 * Nunca ejecuta una acción: el plan pasa siempre por `ConfirmarAccion` (APLICACION §5).
 */

/** Paso de Jezero en la fase base: antes de la tormenta (5), con la tormenta encima (7), con la telemetría en camino (8). */
export function pasoEnBase(estado: GameState): number {
  if (telemetriaPendiente(estado)) return 8;
  return tormentaActiva(estado) ? 7 : 5;
}

/** Guía de Iris para el HUD y la escena; null si Iris está offline. */
export function guiaBase(estado: GameState): GuiaLugar | null {
  return guiaIrisLugar(estado, pasoEnBase(estado), { averiaRevelada: estado.iaBase === "danada" });
}

/** Texto corto del objetivo (clave i18n + variables) que va bajo las placas del HUD. */
export function objetivoBase(guia: GuiaLugar | null): { clave: string; vars?: Vars } {
  if (!guia) return { clave: "ui.mapa.sinObjetivo" };
  const lugarKey = `agentes.iris.lugar.${guia.destino}`;
  if (guia.gesto === "pedir_reparacion") return { clave: "ui.hud.objetivo.averia", vars: { lugarKey } };
  if (guia.experto) return { clave: "ui.hud.objetivo.experto", vars: { lugarKey, expertoKey: `agentes.nombre.${guia.experto}` } };
  return { clave: "ui.hud.objetivo.ir", vars: { lugarKey } };
}

/** Qué hace "usar" (tecla E o botón de acción) en cada lugar. */
export type UsoLugar =
  | { tipo: "plan"; accion: BaseAction; labelKey: string }
  | { tipo: "experto"; experto: Expert; labelKey: string; labelVars: Vars }
  | { tipo: "acciones"; labelKey: string }
  | { tipo: "iris"; labelKey: string };

/**
 * Las etiquetas del botón `[E]` nombran el objeto del lugar ("Inspect the solar panel", como el
 * "Inspect controller" de la lámina), no la acción del panel: así el botón y la lista no se confunden.
 */
export function usoDelLugar(l: LugarObjetivo, estado: GameState): UsoLugar {
  if (l === "panel_solar") return { tipo: "plan", accion: { tipo: "salida_exterior", objetivo: "panel_solar" }, labelKey: "ui.hud.usar.panel_solar" };
  if (l === "escudo") return { tipo: "plan", accion: { tipo: "subir_escudo", nivel: 1 }, labelKey: "ui.hud.usar.escudo" };
  if (l === "taller" && estado.iaBase === "danada") return { tipo: "plan", accion: { tipo: "reparar", equipo: "ia_base" }, labelKey: "ui.hud.usar.reparar_iris" };
  if (l === "mesa") {
    // La consola de enlace está en la mesa (Iris, precaución 2 de ui v8).
    if (tormentaActiva(estado) && !telemetriaPendiente(estado)) return { tipo: "plan", accion: { tipo: "enviar_telemetria" }, labelKey: "ui.hud.usar.enlace" };
    return { tipo: "acciones", labelKey: "ui.hud.usar.mesa" };
  }
  const experto = lugar(l).experto;
  if (experto) return { tipo: "experto", experto, labelKey: "ui.hud.usar.experto", labelVars: { expertoKey: `agentes.nombre.${experto}` } };
  // Sin acción ni experta (reciclador, invernadero, antena, banco): Iris, la guía de la base, cuenta qué es.
  return { tipo: "iris", labelKey: "ui.hud.usar.iris" };
}
