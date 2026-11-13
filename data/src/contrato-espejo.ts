/**
 * ESPEJO TEMPORAL de contracts/src/space-weather.ts (borrador del motor, PR #18 / issue #17).
 * Copia exacta + los campos OPCIONALES que datos propone en #17 (marcados "propuesta datos").
 * Cuando #18 se fusione, este archivo se borra y se importa de @solar-shield/contracts.
 * No añadir lógica aquí.
 */
import { z } from "zod";

export const SourceCardSchema = z.object({
  nombreKey: z.string(),
  url: z.string().url(),
  idFuente: z.string(),
  consultadoEl: z.string(),
  /** propuesta datos: dueño real del dato (NASA CCMC, NOAA, CNSA…). */
  dueno: z.string().optional(),
  /** propuesta datos: "curado" = real precargado (no en vivo); "mock" = inventado. */
  estadoDato: z.enum(["curado", "mock"]).optional(),
});
export type SourceCard = z.infer<typeof SourceCardSchema>;

export const SpaceWeatherKindSchema = z.enum(["CME", "FLR", "SEP", "GST", "RBE"]);
export type SpaceWeatherKind = z.infer<typeof SpaceWeatherKindSchema>;

/** propuesta datos: cada paso real de la cadena, para la Meteoróloga y la línea de tiempo. */
export const SpaceWeatherPhaseSchema = z.object({
  tipo: SpaceWeatherKindSchema,
  idFuente: z.string(),
  /** Horas desde el inicio del evento (calculado por código). */
  offsetHoras: z.number().nonnegative(),
  magnitudTexto: z.string().optional(),
  /** Dónde se midió: en el Sol (telescopios), cerca de la Tierra o en Marte. */
  observadoEn: z.enum(["Sol", "Tierra", "Marte"]),
});

export const SpaceWeatherEventSchema = z.object({
  id: z.string(),
  tipo: SpaceWeatherKindSchema,
  inicio: z.string(),
  duracionHoras: z.number().nonnegative(),
  intensidad: z.number().min(0).max(1),
  magnitudTexto: z.string().optional(),
  fuente: SourceCardSchema,
  /** propuesta datos */
  fases: z.array(SpaceWeatherPhaseSchema).optional(),
  /** propuesta datos: "observado" = se midió en Marte; "modelado" = DONKI predice llegada a Marte; "escenario" = pasó cerca de la Tierra y el juego imagina que llega a la base. */
  marcoMarte: z.enum(["observado", "modelado", "escenario"]).optional(),
  /** propuesta datos: llegada a Marte predicha por WSA-ENLIL (DONKI). Es un modelo, no una medición. */
  llegadaMarte: z
    .object({ idFuente: z.string(), offsetHoras: z.number().nonnegative(), rozando: z.boolean() })
    .optional(),
});
export type SpaceWeatherEvent = z.infer<typeof SpaceWeatherEventSchema>;
