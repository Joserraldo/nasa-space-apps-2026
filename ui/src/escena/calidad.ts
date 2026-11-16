/**
 * Ajustes del renderer por calidad gráfica. Dueño: frente D (rendimiento, PLAN-JUGABILIDAD §3).
 * `escena3d.ts` los aplica; aquí solo viven los números.
 */
import type { CalidadGrafica } from "../juego/ajustes";
import { LUZ } from "./cielo";

/** DPR máximo y sombras por calidad (APLICACION §8, MARTE §5). `baja` baja de 1: es el nivel al que cae la escena
 * cuando no sostiene ~28 fps, y sin GPU el costo crece con los píxeles (medido con SwiftShader: base de 34 a ~50 fps). */
export const AJUSTE_CALIDAD: Readonly<Record<CalidadGrafica, { dpr: number; sombra: number | null; antialias: boolean }>> = {
  alta: { dpr: 1.5, sombra: LUZ.tamanoSombra.alta, antialias: true },
  media: { dpr: 1.25, sombra: LUZ.tamanoSombra.baja, antialias: true },
  baja: { dpr: 0.75, sombra: null, antialias: false },
};

/** Nivel al que la escena propone bajar cuando no rinde; `null` en el más bajo. */
export const MAS_BAJA: Readonly<Record<CalidadGrafica, CalidadGrafica | null>> = { alta: "media", media: "baja", baja: null };
