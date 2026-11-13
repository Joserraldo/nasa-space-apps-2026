/**
 * Terreno de Jezero (Mars Trek) y sitios candidatos. Las medidas (elevación) son de NASA/ESA
 * vía Mars Trek; pendiente, horizonte y puntajes son DERIVADOS por el equipo con reglas fijas
 * (docs/science/terreno.md). Nada de esto es "en vivo".
 */
import { z } from "zod";

/** Recuadro del mapa: el cráter completo (~45 km) con su borde. Grados este / norte. */
export const JEZERO = { oeste: 76.9, sur: 17.7, este: 78.3, norte: 19.1, ancho: 280, alto: 280 } as const;

/** Radio de Marte (esfera IAU 2000) usado por Trek para su proyección. */
export const RADIO_MARTE_M = 3_396_190;

const Puntaje = z.number().min(0).max(1);

export const SitioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombreKey: z.string(),
  descripcionKey: z.string(),
  lon: z.number(),
  lat: z.number(),
  /** Medido (DEM MOLA+HRSC vía Mars Trek). */
  elevacionM: z.number(),
  /** Derivado: pendiente media (grados) en un radio de ~1,5 km. */
  pendienteGrados: z.number().min(0),
  /** Derivado: altura media del horizonte (grados) en 8 direcciones, hasta 15 km. */
  horizonteGrados: z.number().min(0),
  /** Derivados 0–1 (1 = mejor). Ningún sitio es perfecto: lo comprueba una prueba. */
  puntajes: z.object({ plano: Puntaje, luz: Puntaje, blindaje: Puntaje }),
});
export type Sitio = z.infer<typeof SitioSchema>;

export const TerrenoSchema = z.object({
  version: z.literal("0.1.0"),
  id: z.literal("jezero"),
  nombreKey: z.string(),
  bbox: z.object({ oeste: z.number(), sur: z.number(), este: z.number(), norte: z.number() }),
  dem: z.object({ archivo: z.string(), ancho: z.number().int(), alto: z.number().int(), metrosPorPixel: z.number(), minM: z.number(), maxM: z.number() }),
  imagenes: z.object({
    sombreado: z.string(),
    ctx: z.array(z.object({ archivo: z.string(), oeste: z.number(), norte: z.number(), grados: z.number() })),
  }),
  sitios: z.array(SitioSchema).min(3).max(4),
  fuente: z.object({
    nombreKey: z.literal("fuente.marsTrek"),
    dueno: z.string(),
    urls: z.array(z.string().url()).min(1),
    consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estadoDato: z.literal("curado"),
    /** Clave del texto "valores derivados por el equipo a partir de…". */
    derivadoKey: z.literal("datos.terreno.derivado"),
  }),
});
export type Terreno = z.infer<typeof TerrenoSchema>;
