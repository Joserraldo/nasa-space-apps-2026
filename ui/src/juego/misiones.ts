import {
  MISION_JEZERO,
  MISION_LUNA_POLO_SUR,
  MISION_LUNA_VISIBLE,
  MISION_MARTE_POLO_NORTE,
  MISION_OUTPOST_SORPRESA,
  type Mision,
} from "@solar-shield/missions";
import { SEMILLA_DORADA } from "@solar-shield/engine";
import { aplicarTemaMundo, temaDeMision } from "../escena/temaMundo.js";

/**
 * EXPERIMENTAL: catálogo de misiones jugables desde la interfaz. Jezero va primero y es la de
 * respaldo: una partida guardada sin misión, o con un id desconocido, sigue siendo Jezero.
 */
export const MISIONES: readonly Mision[] = [
  MISION_JEZERO,
  MISION_MARTE_POLO_NORTE,
  MISION_LUNA_POLO_SUR,
  MISION_LUNA_VISIBLE,
  MISION_OUTPOST_SORPRESA,
];

export function misionPorId(id: string | undefined): Mision {
  return MISIONES.find((m) => m.id === id) ?? MISION_JEZERO;
}

/** La misión que sigue en el catálogo (da la vuelta al final). */
export function siguienteMision(id: string): Mision {
  const i = MISIONES.findIndex((m) => m.id === id);
  return MISIONES[(i + 1) % MISIONES.length]!;
}

/** Semilla nueva al azar con el id de la misión, legible para el niño en la pantalla final. */
export function semillaNueva(misionId: string): string {
  return `${misionId}-${Math.floor(Math.random() * 100000)}`;
}

/** Misión y semilla pedidas en la URL (`?mision=luna-polo-sur&semilla=x`), para probar sin jugar todo. */
export function misionDeLaUrl(): { misionId: string; semilla: string } {
  const p = typeof location === "undefined" ? new URLSearchParams() : new URLSearchParams(location.search);
  const misionId = misionPorId(p.get("mision") ?? undefined).id;
  return { misionId, semilla: p.get("semilla") ?? (misionId === MISION_JEZERO.id ? SEMILLA_DORADA : semillaNueva(misionId)) };
}

/**
 * Misión de la partida en pantalla. La fija App en cada render a partir del reductor; las
 * pantallas la leen aquí en vez de usar Jezero fijo. Atajo del experimento: un contexto de React
 * sería lo limpio si esto pasa a producción.
 */
let activa: Mision = MISION_JEZERO;
/** También pinta el mundo 3D de esa misión (escena/temaMundo.ts) antes de que se monte. */
export function fijarMision(m: Mision): void { activa = m; aplicarTemaMundo(temaDeMision(m.id)); }
export function misionActiva(): Mision { return activa; }
