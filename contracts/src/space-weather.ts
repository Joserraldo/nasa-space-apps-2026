import { z } from "zod";

/**
 * SpaceWeatherEvent: evento real de DONKI normalizado por el rol datos.
 * BORRADOR del rol motor; el rol datos es dueño de la forma final (issue `contrato`).
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
});
export type SourceCard = z.infer<typeof SourceCardSchema>;

export const SpaceWeatherKindSchema = z.enum(["CME", "FLR", "SEP", "GST", "RBE"]);
export type SpaceWeatherKind = z.infer<typeof SpaceWeatherKindSchema>;

export const SpaceWeatherEventSchema = z.object({
  id: z.string(),
  tipo: SpaceWeatherKindSchema,
  /** Inicio real del evento, ISO 8601 UTC. */
  inicio: z.string(),
  /** Duración en horas reales. */
  duracionHoras: z.number().nonnegative(),
  /** Intensidad normalizada 0-1 para el motor (datos documenta la escala). */
  intensidad: z.number().min(0).max(1),
  /** Clase/magnitud original (ej. "X1.2", "S2", "Kp 7") para la tarjeta. */
  magnitudTexto: z.string().optional(),
  fuente: SourceCardSchema,
});
export type SpaceWeatherEvent = z.infer<typeof SpaceWeatherEventSchema>;
