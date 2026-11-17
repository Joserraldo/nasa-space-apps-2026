/**
 * Ajustes del renderer por calidad gráfica. Dueño: frente D (rendimiento, PLAN-JUGABILIDAD §3).
 * `escena3d.ts` aplica `dpr`, `sombra` y `antialias`; `sistemas/filtroSombra.ts` aplica `filtroSombra`.
 * Aquí solo viven los números.
 */
import type { CalidadGrafica } from "../juego/ajustes";
import { LUZ } from "./cielo";

/** Filtro de la sombra del Sol: `suave` (PCF suave, varias lecturas por píxel) o `simple` (una lectura). */
export type FiltroSombra = "suave" | "simple";

/**
 * DPR máximo y sombras por calidad (APLICACION §8, MARTE §5). `baja` baja de 1: es el nivel al que cae la escena
 * cuando no sostiene ~28 fps, y sin GPU el costo crece con los píxeles (medido con SwiftShader: base de 34 a ~50 fps).
 *
 * `media` (D4): sin GPU el costo es casi todo por píxel, y lo que más pesa es leer la sombra en cada uno.
 * Medido en headless sin GPU con escala de pantalla 1,25 y la misma carga de la PC: DPR 1,25 + antialias +
 * sombra suave 7 fps; DPR 1 sin antialias con sombra simple 18 fps (con `baja` en 35). Sigue teniendo
 * sombras del Sol, con borde duro; `alta` conserva el borde suave.
 */
export interface AjusteCalidad {
  dpr: number;
  sombra: number | null;
  antialias: boolean;
  filtroSombra: FiltroSombra | null;
  /**
   * Etapa A (luz, atmósfera y color). Cada efecto nuevo tiene su interruptor:
   * - `entorno`: `envMap` del cielo procedural (PMREM). Metal y vidrio reflejan el cielo y el cielo rellena las sombras.
   * - `nieblaAltura`: niebla densa a ras del suelo y limpia cerca del jugador (`atmosfera.ts`); sin ella, niebla lineal.
   * - `gradacion`: AgX + curva en S, tono partido y saturación (`atmosfera.ts`); sin ella, sin tone mapping.
   * - `ao` y `bloom`: pases de post (GTAO y bloom con umbral alto). Cualquiera de los dos monta el compositor.
   */
  entorno: boolean;
  nieblaAltura: boolean;
  gradacion: boolean;
  ao: boolean;
  bloom: boolean;
}

export const AJUSTE_CALIDAD: Readonly<Record<CalidadGrafica, Readonly<AjusteCalidad>>> = {
  alta: { dpr: 1.5, sombra: LUZ.tamanoSombra.alta, antialias: true, filtroSombra: "suave", entorno: true, nieblaAltura: true, gradacion: true, ao: true, bloom: true },
  media: { dpr: 1.25, sombra: LUZ.tamanoSombra.baja, antialias: true, filtroSombra: "suave", entorno: true, nieblaAltura: true, gradacion: true, ao: false, bloom: false },
  baja: { dpr: 0.75, sombra: null, antialias: false, filtroSombra: null, entorno: false, nieblaAltura: true, gradacion: false, ao: false, bloom: false },
};

/** Monta el compositor de post (solo si hay AO o bloom). */
export function conPost(nivel: CalidadGrafica): boolean {
  const a = AJUSTE_CALIDAD[nivel];
  return a.ao || a.bloom;
}

/** Nivel al que la escena propone bajar cuando no rinde; `null` en el más bajo. */
export const MAS_BAJA: Readonly<Record<CalidadGrafica, CalidadGrafica | null>> = { alta: "media", media: "baja", baja: null };
