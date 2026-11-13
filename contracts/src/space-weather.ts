import { z } from "zod";

/**
 * SpaceWeatherEvent: evento real de DONKI normalizado por el rol datos.
 * Dueño de la forma: rol datos (issue #17). Los opcionales los pidió datos; nada obligatorio cambió.
 * Las cifras NUNCA se inventan: vienen de data/ con su fuente.
 */
export const SourceCardSchema = z.object({
  /** Clave i18n del nombre de la fuente (ej. "fuente.donki"). */
  nombreKey: z.string(),
  url: z.string().url(),
  /** Identificador del evento en la fuente (ej. activityID de DONKI). */
  idFuente: z.string(),
  /** Fecha de consulta ISO. Datos estáticos: nunca se muestran como "en vivo". */
  consultadoEl: z.string(),
  /** Dueño real del dato (NASA CCMC, NOAA, CNSA…), para atribuir bien. */
  dueno: z.string().optional(),
  /** "curado" = real precargado (no en vivo); "mock" = inventado para pruebas. */
  estadoDato: z.enum(["curado", "mock"]).optional(),
});
export type SourceCard = z.infer<typeof SourceCardSchema>;

/** RBE queda en el enum pero datos no lo llena (cinturones de la Tierra). */
export const SpaceWeatherKindSchema = z.enum(["CME", "FLR", "SEP", "GST", "RBE"]);
export type SpaceWeatherKind = z.infer<typeof SpaceWeatherKindSchema>;

/** Cada paso real de la cadena FLR→CME→SEP→GST, para la Meteoróloga y la línea de tiempo. */
export const SpaceWeatherPhaseSchema = z.object({
  tipo: SpaceWeatherKindSchema,
  idFuente: z.string(),
  /** Horas desde el inicio del evento. */
  offsetHoras: z.number().nonnegative(),
  magnitudTexto: z.string().optional(),
  /** Dónde se midió: en el Sol (telescopios), cerca de la Tierra o en Marte. */
  observadoEn: z.enum(["Sol", "Tierra", "Marte"]),
});
export type SpaceWeatherPhase = z.infer<typeof SpaceWeatherPhaseSchema>;

/** Llegada a Marte según el modelo WSA-ENLIL de DONKI (es un modelo, no una medición). */
export const MarsArrivalSchema = z.object({
  idFuente: z.string(),
  offsetHoras: z.number(),
  /** true si el modelo dice que la nube solo roza Marte. */
  rozando: z.boolean(),
});
export type MarsArrival = z.infer<typeof MarsArrivalSchema>;

/** Lo que midió RAD (Curiosity) en la superficie de Marte, vía OSDR RadLab. Dosis absorbida, nunca mSv. */
export const MarsMeasurementSchema = z.object({
  unidad: z.literal("µGy/h"),
  fondo: z.number().nonnegative(),
  pico: z.number().nonnegative(),
  /** pico / fondo. Con factor ≥ 1.5, marcoMarte = "observado". */
  factor: z.number().positive(),
  offsetHorasPico: z.number(),
});
export type MarsMeasurement = z.infer<typeof MarsMeasurementSchema>;

export const SpaceWeatherEventSchema = z.object({
  id: z.string(),
  tipo: SpaceWeatherKindSchema,
  /** Inicio real del evento, ISO 8601 UTC. */
  inicio: z.string(),
  /** Duración en horas reales. */
  duracionHoras: z.number().nonnegative(),
  /**
   * Intensidad normalizada 0-1 (escala del equipo, docs/science/intensidad.md):
   * FLR (log10(flujo)+6)/3 · CME (km/s−300)/2200 · GST Kp/9 · evento = máximo de sus fases.
   */
  intensidad: z.number().min(0).max(1),
  /** Clase/magnitud original (ej. "X1.2", "S2", "Kp 7") para la tarjeta. */
  magnitudTexto: z.string().optional(),
  fuente: SourceCardSchema,
  fases: z.array(SpaceWeatherPhaseSchema).optional(),
  /**
   * "observado" = RAD lo midió en Marte; "modelado" = WSA-ENLIL predice llegada a Marte;
   * "escenario" = pasó cerca de la Tierra y el juego imagina que llega a la base.
   */
  marcoMarte: z.enum(["observado", "modelado", "escenario"]).optional(),
  llegadaMarte: MarsArrivalSchema.optional(),
  medicionMarte: MarsMeasurementSchema.optional(),
});
export type SpaceWeatherEvent = z.infer<typeof SpaceWeatherEventSchema>;
