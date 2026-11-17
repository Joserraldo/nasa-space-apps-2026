/**
 * P0.1 Dosis de radiación de la tripulación, en mSv APROXIMADOS (contrato: CrewMember.dosisMSv).
 *
 * dosis por turno = fondo del sitio (mSv/día, dato con fuente en data/) / TICKS_POR_DIA
 *                 × multiplicador de la tormenta (1 fuera de su ventana)
 *                 × (1 − REDUCCION_MAX_BLINDAJE × blindaje / 100)
 *                 × (FACTOR_REFUGIO si la tripulación está en el refugio, si no 1)
 *                 × factorEscudo (si hay un subir_escudo activo)
 *
 * Escudo activo: subir_escudo reduce la dosis FACTOR_ESCUDO_POR_NIVEL por nivel durante DURACION_ESCUDO_TICKS (parámetro educativo).
 *
 * Limitaciones (es una aproximación educativa, no un cálculo de dosimetría):
 * - El fondo sí es un dato medido con fuente (RAD/Curiosity en Marte; Chang'e-4 en la Luna).
 * - En Marte, el multiplicador de la tormenta es el `factor` medido por RAD (pico/fondo de dosis
 *   ABSORBIDA, µGy/h); aplicarlo a dosis equivalente (mSv) es una simplificación declarada.
 * - Fuera de Marte no hay medición en superficie: el multiplicador es un valor de juego.
 * - Blindaje y refugio usan parámetros educativos de design/, no valores físicos.
 * - No modela tipo de partícula, factor de calidad, dosis por órgano ni la hora exacta del evento;
 *   un turno es 1/TICKS_POR_DIA de día.
 */
import type { GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import {
  DURACION_ESCUDO_TICKS,
  DURACION_REFUGIO_TICKS,
  FACTOR_ESCUDO_POR_NIVEL,
  FACTOR_REFUGIO,
  FACTOR_TORMENTA_SIN_MEDICION,
  REDUCCION_MAX_BLINDAJE,
  REFERENCIA_FONDO_DOSIS,
  TICKS_POR_DIA,
} from "@solar-shield/design";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { senalDeDano } from "./orbita.js";
import { tormentaEnCurso } from "./tormenta.js";

/**
 * ¿La tripulación está en el refugio en este tick? Mira la última decisión que entró o salió del
 * refugio antes del tick actual: refugiarse protege el turno siguiente y DURACION_REFUGIO_TICKS;
 * una salida_exterior posterior lo termina y volver a refugiarse lo reactiva.
 */
export function enRefugio(estado: Pick<GameState, "causas" | "tick">): boolean {
  let ultima: GameState["causas"][number] | undefined;
  for (const causa of estado.causas) {
    const tipo = causa.accion?.tipo;
    if (causa.origen !== "decision" || (tipo !== "refugiarse" && tipo !== "salida_exterior")) continue;
    if (causa.tick >= estado.tick) continue;
    ultima = causa;
  }
  if (!ultima || ultima.accion?.tipo !== "refugiarse") return false;
  return estado.tick - ultima.tick <= DURACION_REFUGIO_TICKS;
}

/**
 * Multiplicador de la dosis por el escudo. Mira la última decisión `subir_escudo` antes del tick
 * actual: protege el turno siguiente y DURACION_ESCUDO_TICKS. Sin escudo activo, no cambia la dosis (1).
 */
export function factorEscudo(estado: Pick<GameState, "causas" | "tick">): number {
  let ultimoTick: number | undefined;
  let nivel = 0;
  for (const causa of estado.causas) {
    if (causa.origen !== "decision" || causa.accion?.tipo !== "subir_escudo") continue;
    if (causa.tick >= estado.tick) continue;
    ultimoTick = causa.tick;
    nivel = causa.accion.nivel;
  }
  if (ultimoTick === undefined || estado.tick - ultimoTick > DURACION_ESCUDO_TICKS) return 1;
  return Math.max(0, 1 - FACTOR_ESCUDO_POR_NIVEL * nivel);
}

/**
 * Multiplicador de la dosis por la tormenta. Fuera de su ventana no hay efecto (1). En Marte manda
 * el factor medido por RAD; donde no hay medición en superficie es un valor de juego proporcional
 * a la señal de daño.
 */
export function multiplicadorTormenta(estado: GameState, mision: Mision = MISION_JEZERO): number {
  if (!tormentaEnCurso(estado, mision)) return 1;
  const enMarte = estado.sitio === "marte_jezero" || estado.sitio === "marte_polo_norte";
  if (enMarte && estado.tormenta?.medicionMarte) return estado.tormenta.medicionMarte.factor;
  return 1 + senalDeDano(estado) * (FACTOR_TORMENTA_SIN_MEDICION - 1);
}

/** Dosis aproximada en mSv que recibe cada tripulante disponible en este turno. Sin redondear. */
export function dosisDelTurno(estado: GameState, mision: Mision = MISION_JEZERO): number {
  const fondo = referenciaDosis(REFERENCIA_FONDO_DOSIS[estado.sitio]).valor / TICKS_POR_DIA;
  const proteccion = 1 - REDUCCION_MAX_BLINDAJE * (estado.recursos.blindaje / 100);
  return fondo * multiplicadorTormenta(estado, mision) * proteccion * (enRefugio(estado) ? FACTOR_REFUGIO : 1) * factorEscudo(estado);
}

/** Suma la dosis del turno a cada tripulante disponible. No toca nada más del estado. */
export function acumularDosis(estado: GameState, mision: Mision = MISION_JEZERO): GameState {
  const d = dosisDelTurno(estado, mision);
  return {
    ...estado,
    tripulacion: estado.tripulacion.map((t) =>
      t.disponible ? { ...t, dosisMSv: Math.round((t.dosisMSv + d) * 1000) / 1000 } : t,
    ),
  };
}

/** Dosis máxima acumulada entre los tripulantes disponibles (0 si no hay ninguno). */
export function dosisMaximaTripulacion(estado: Pick<GameState, "tripulacion">): number {
  let max = 0;
  for (const t of estado.tripulacion) {
    if (t.disponible && t.dosisMSv > max) max = t.dosisMSv;
  }
  return max;
}
