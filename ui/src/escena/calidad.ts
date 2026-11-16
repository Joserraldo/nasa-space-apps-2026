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
export const AJUSTE_CALIDAD: Readonly<
  Record<CalidadGrafica, { dpr: number; sombra: number | null; antialias: boolean; filtroSombra: FiltroSombra | null }>
> = {
  alta: { dpr: 1.5, sombra: LUZ.tamanoSombra.alta, antialias: true, filtroSombra: "suave" },
  media: { dpr: 1.25, sombra: LUZ.tamanoSombra.baja, antialias: true, filtroSombra: "suave" },
  baja: { dpr: 0.75, sombra: null, antialias: false, filtroSombra: null },
};

/** Nivel al que la escena propone bajar cuando no rinde; `null` en el más bajo. */
export const MAS_BAJA: Readonly<Record<CalidadGrafica, CalidadGrafica | null>> = { alta: "media", media: "baja", baja: null };
