/**
 * Referencias de dosis (para la Doctora) y tarjetas de ciencia de OSDR (pantalla final).
 * Dosis: SIEMPRE dosis equivalente en mSv/día; nunca se mezcla con dosis absorbida (mGy, µGy).
 * Cada referencia dice si es de NASA o no (`esNasa`): la de la Luna es de CNSA.
 */
import { z } from "zod";

export const ReferenciaDosisSchema = z.object({
  id: z.string(),
  lugarKey: z.string(),
  valor: z.number().positive(),
  incertidumbre: z.number().positive().nullable(),
  unidad: z.literal("mSv/día"),
  magnitud: z.literal("dosis equivalente"),
  periodo: z.string(),
  instrumento: z.string(),
  dueno: z.string(),
  cita: z.string().min(20),
  url: z.string().url(),
  esNasa: z.boolean(),
});

export const RadiacionSchema = z.object({
  version: z.literal("0.1.0"),
  consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  referencias: z.array(ReferenciaDosisSchema).min(1),
});
export type Radiacion = z.infer<typeof RadiacionSchema>;

export const TarjetaOsdrSchema = z.object({
  /** ID real del estudio en OSDR. */
  id: z.string().regex(/^OSD-\d+$/),
  tema: z.enum(["comida", "huesos", "radiacion"]),
  tituloOriginal: z.string(),
  url: z.string().url(),
  dueno: z.string(),
  tituloKey: z.string(),
  textoKey: z.string(),
});

export const OsdrSchema = z.object({
  version: z.literal("0.1.0"),
  consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consulta: z.string(),
  tarjetas: z.array(TarjetaOsdrSchema).min(1),
});
export type Osdr = z.infer<typeof OsdrSchema>;

/** Resumen de la dosis absorbida en Artemis I (HERA, vía RadLab), calculado por scripts/artemis.ts. */
export const ArtemisSchema = z.object({
  version: z.literal("0.1.0"),
  mision: z.literal("Artemis I"),
  instrumento: z.string(),
  unidad: z.literal("µGy/h"),
  magnitud: z.literal("dosis absorbida"),
  desde: z.string(),
  hasta: z.string(),
  muestras: z.number().int().positive(),
  medianaCrucero: z.number().positive(),
  pico: z.object({ valor: z.number().positive(), hora: z.string() }),
  vecesPicoSobreCrucero: z.number().int().positive(),
  diario: z.array(z.object({ dia: z.string(), mediana: z.number(), maximo: z.number() })).min(1),
  fuente: z.object({ nombreKey: z.string(), dueno: z.string(), url: z.string().url(), consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
});
export type Artemis = z.infer<typeof ArtemisSchema>;

/** Clave i18n de la fuente de cada referencia de dosis (la tarjeta la muestra ui). */
export const FUENTE_DOSIS: Record<string, string> = {
  "marte-superficie": "fuente.dosis.marte",
  "marte-crucero": "fuente.dosis.marte",
  "luna-superficie": "fuente.dosis.lunaIss",
  iss: "fuente.dosis.lunaIss",
};
