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
