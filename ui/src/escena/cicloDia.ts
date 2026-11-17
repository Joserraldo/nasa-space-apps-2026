/**
 * Ciclo del día en Jezero (D3). Dueño: Frente D. Funciones puras; las aplica `sistemas/cicloDia.ts`.
 *
 * - El sol (día marciano) dura 24,6597 h (NASA NSSDC, Mars Fact Sheet:
 *   https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html, "Length of day"). La hora local se
 *   mide en horas de ese sol.
 * - La misión va de día a tarde y termina en el atardecer azulado (MARTE.md §4: halo azul junto al Sol,
 *   ámbar en el resto; crepúsculo largo, no un corte a noche).
 * - **Sin noche jugable** (PLAN-JUGABILIDAD D3): el motor todavía no modela que de noche el panel no da
 *   energía, y la imagen no puede contradecir a Iris ("sin sol no hay energía"). Por eso el Sol nunca baja
 *   de `ELEVACION_MINIMA`.
 * - La escena no recibe la hora del motor: el momento sale de la fase de la misión (`VistaEscena.fase`).
 *   Si el motor expone el avance del día, `momentoDeFase` se reemplaza sin tocar lo demás.
 */
import * as THREE from "three";
import type { FaseVista } from "./vista";
import { INTENSIDAD, LUZ, PALETA_CIELO } from "./cielo";

/** Duración del sol en horas (NSSDC). [V] */
export const DURACION_SOL_H = 24.6597;
/** Altura máxima del Sol al mediodía (rad). Valor de juego, sin latitud ni estación. [E] */
export const ELEVACION_MAXIMA = THREE.MathUtils.degToRad(45);
/** El Sol nunca baja de acá: sin noche jugable. [E] */
export const ELEVACION_MINIMA = THREE.MathUtils.degToRad(5);

/** Momento del día: 0 = día (mañana), 0,5 = tarde, 1 = atardecer. */
export type MomentoDia = number;

/** Hora local (h de sol) de cada momento clave. [E] La del día da la misma altura que `LUZ.direccionSol` (38°), así el día no cambia. */
export const HORAS = { dia: 10.15, tarde: 16, atardecer: 17.9 } as const;

/** Momento según la fase: día hasta la base, tarde durante la tormenta y atardecer en el final. */
export function momentoDeFase(fase: FaseVista | null | undefined): MomentoDia {
  if (fase === "final") return 1;
  if (fase === "tormenta") return 0.5;
  return 0;
}

/** Hora local del momento, interpolando entre las horas clave. */
export function horaDelMomento(m: MomentoDia): number {
  const k = Math.min(1, Math.max(0, m));
  return k <= 0.5 ? HORAS.dia + (HORAS.tarde - HORAS.dia) * (k / 0.5) : HORAS.tarde + (HORAS.atardecer - HORAS.tarde) * ((k - 0.5) / 0.5);
}

/**
 * Altura del Sol (rad) a una hora local: sale a un cuarto del sol y se pone a tres cuartos (modelo de
 * juego, sin estación ni latitud); nunca baja de `ELEVACION_MINIMA`.
 */
export function elevacionSol(hora: number): number {
  const salida = DURACION_SOL_H / 4, luz = DURACION_SOL_H / 2;
  const e = ELEVACION_MAXIMA * Math.sin((Math.PI * (hora - salida)) / luz);
  return Math.max(ELEVACION_MINIMA, e);
}

/** Lo que el ciclo cambia en la luz y el cielo para un momento. */
export interface LuzMomento {
  /** Dirección hacia el Sol (normalizada): mismo rumbo que de día (arriba a la izquierda), más baja. */
  direccion: THREE.Vector3;
  colorSol: THREE.Color;
  intensidadSol: number;
  colorCieloHemi: THREE.Color;
  intensidadHemi: number;
  /** Mezcla de las paletas del cielo: 0 = día, 1 = atardecer. */
  mezclaCielo: number;
  niebla: THREE.Color;
  fondo: THREE.Color;
}

const RUMBO = new THREE.Vector2(LUZ.direccionSol[0], LUZ.direccionSol[2]).normalize();

/** Luz y cielo de un momento. La tarde ya baja el Sol; el cielo se vuelve atardecer solo en la segunda mitad. */
export function luzDelMomento(m: MomentoDia): LuzMomento {
  const k = Math.min(1, Math.max(0, m));
  const e = elevacionSol(horaDelMomento(k));
  const direccion = new THREE.Vector3(RUMBO.x * Math.cos(e), Math.sin(e), RUMBO.y * Math.cos(e)).normalize();
  const cielo = Math.max(0, (k - 0.5) / 0.5);
  const dia = PALETA_CIELO.dia, tarde = PALETA_CIELO.atardecer;
  return {
    direccion,
    // Sol blanco cálido de día; al atardecer toma algo del halo azul (el atardecer azul de Marte, MARTE.md §4).
    colorSol: new THREE.Color(LUZ.colorSol).lerp(new THREE.Color(tarde.halo), 0.35 * cielo),
    intensidadSol: INTENSIDAD.sol * (1 - 0.15 * Math.min(1, k / 0.5) - 0.3 * cielo),
    colorCieloHemi: new THREE.Color(LUZ.hemisferica.dia.cielo).lerp(new THREE.Color(LUZ.hemisferica.atardecer.cielo), cielo),
    intensidadHemi: INTENSIDAD.hemisferica * (1 - 0.15 * cielo),
    mezclaCielo: cielo,
    niebla: new THREE.Color(dia.niebla).lerp(new THREE.Color(tarde.niebla), cielo),
    fondo: new THREE.Color(dia.horizonte).lerp(new THREE.Color(tarde.horizonte), cielo),
  };
}

/** Acerca el momento actual al objetivo a velocidad constante (`segundos` para ir de 0 a 1). */
export function acercarMomento(actual: MomentoDia, objetivo: MomentoDia, dt: number, segundos = 6): MomentoDia {
  const paso = dt / segundos;
  if (Math.abs(objetivo - actual) <= paso) return objetivo;
  return actual + Math.sign(objetivo - actual) * paso;
}
