/**
 * Regiones sin mapa propio (plan B): solo cifras calculadas por código a partir de datos verificados.
 * Polo norte de Marte (`marte_polo_norte` del contrato): Mars Trek no exporta su elevación
 * (ver docs/science/terreno.md), así que NO hay sitios ni puntajes de terreno, solo la luz por latitud.
 */
import { z } from "zod";

/** Inclinación del eje de Marte [V] NASA NSSDC, ficha de Marte (actualizada el 19 may 2025). */
export const INCLINACION_EJE_MARTE_GRADOS = 25.19;
export const FUENTE_INCLINACION = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html";

/**
 * Gravedad superficial media de Marte [V] NASA NSSDC, ficha de Marte ("Surface gravity (mean) 3.73 m/s2", consultada el
 * 2026-11-14). Para la física de la escena 3D: ui la importa en vez de escribir el número (#141).
 */
export const GRAVEDAD_MARTE_MS2 = 3.73;
/** Gravedad superficial de la Luna [V] NASA NSSDC, ficha de la Luna (1.62 m/s2). Para las misiones lunares. */
export const GRAVEDAD_LUNA_MS2 = 1.62;
export const FUENTE_GRAVEDAD_LUNA = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html";

/** Altura máxima del Sol a mediodía en pleno verano (grados): 90 − latitud + inclinación. */
export const solMaxVerano = (lat: number) => Math.min(90, 90 - Math.abs(lat) + INCLINACION_EJE_MARTE_GRADOS);
/** Hay noche polar (días sin Sol) a partir de esta latitud: 90 − inclinación. */
export const LATITUD_NOCHE_POLAR = 90 - INCLINACION_EJE_MARTE_GRADOS;

export const RegionSchema = z.object({
  id: z.literal("marte_polo_norte"),
  nombreKey: z.string(),
  descripcionKey: z.string(),
  /** Latitud de referencia (grados N) usada para los cálculos. */
  latitud: z.number().min(-90).max(90),
  solMaxVeranoGrados: z.number(),
  hayNochePolar: z.boolean(),
  tieneMapa: z.literal(false),
  fuente: z.object({
    nombreKey: z.string(),
    url: z.string().url(),
    consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    derivadoKey: z.string(),
  }),
});
export type Region = z.infer<typeof RegionSchema>;

/** Polo norte, latitud de referencia 82° N (borde de los datos de elevación que sí probamos). */
export function regionPoloNorte(): Region {
  const latitud = 82;
  return RegionSchema.parse({
    id: "marte_polo_norte",
    nombreKey: "datos.region.marte_polo_norte.nombre",
    descripcionKey: "datos.region.marte_polo_norte.descripcion",
    latitud,
    solMaxVeranoGrados: Math.round(solMaxVerano(latitud) * 10) / 10,
    hayNochePolar: latitud >= LATITUD_NOCHE_POLAR,
    tieneMapa: false,
    fuente: {
      nombreKey: "fuente.nssdc",
      url: FUENTE_INCLINACION,
      consultadoEl: "2026-11-13",
      derivadoKey: "datos.region.derivado",
    },
  });
}
