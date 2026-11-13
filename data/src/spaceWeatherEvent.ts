/**
 * PROPUESTA de contrato SpaceWeatherEvent (v0.1.0).
 * Vive aquí hasta que el issue `contrato` lo apruebe el motor y los agentes;
 * entonces se mueve a /contracts sin cambiar la forma.
 *
 * Un evento = una "tormenta" del juego: una cadena real de DONKI
 * (fulguración -> CME -> partículas -> tormenta geomagnética), ya normalizada.
 * Nada de lógica aquí: solo forma y validación.
 */
import { z } from "zod";

export const SCHEMA_VERSION = "0.1.0" as const;

/** Texto visible bilingüe. Nunca uno sin el otro. */
export const I18nText = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

/** Fecha/hora UTC tal como la da DONKI: 2024-05-10T15:00Z (con o sin segundos). */
const UtcTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/, "hora UTC estilo DONKI");

/** Fase de la tormenta, en el orden en que pasa. */
export const PhaseType = z.enum(["FLR", "CME", "SEP", "GST"]);

export const Phase = z.object({
  type: PhaseType,
  /** ID real de DONKI (flrID, activityID, sepID, gstID). En mocks empieza por "MOCK-". */
  donkiId: z.string().min(1),
  time: UtcTime,
  /** Clase GOES de la fulguración, ej. "X8.7". Solo en FLR. */
  classType: z.string().regex(/^[ABCMX]\d+(\.\d+)?$/).optional(),
  /** Velocidad de la CME en km/s (análisis más preciso de DONKI). Solo en CME. */
  speedKmS: z.number().positive().optional(),
  /** Kp máximo observado (0–9). Solo en GST. */
  kpMax: z.number().min(0).max(9).optional(),
  /** Instrumentos tal como los nombra DONKI. */
  instruments: z.array(z.string()).default([]),
  /** Página pública del evento en DONKI. */
  link: z.string().url().optional(),
});

/** Tarjeta de fuente que ve el niño (y el jurado). */
export const SourceCard = z.object({
  title: I18nText,
  /** Qué pasó, en lenguaje para 7–12 años. */
  whatHappened: I18nText,
  /** Dueño real del dato. DONKI = NASA CCMC; Kp lo aporta NOAA vía DONKI. */
  provider: z.string().min(1),
  links: z.array(z.string().url()).min(1),
  /** Día en que el equipo consultó la API (AAAA-MM-DD). */
  retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Etiqueta obligatoria: "datos reales curados, no en vivo" o "datos de prueba". */
  label: I18nText,
});

export const SpaceWeatherEvent = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    /** Slug estable del equipo, ej. "2024-05-gannon". */
    id: z.string().regex(/^[a-z0-9-]+$/),
    /** mock = inventado para desarrollar; curated = real de DONKI, precargado. */
    dataStatus: z.enum(["mock", "curated"]),
    name: I18nText,
    startTime: UtcTime,
    endTime: UtcTime,
    /** Región activa con la numeración de DONKI (5 cifras, ej. 13664 = AR 3664 de NOAA). */
    activeRegionNum: z.number().int().positive().nullable(),
    phases: z.array(Phase).min(1),
    source: SourceCard,
  })
  .superRefine((ev, ctx) => {
    const mockIds = ev.phases.every((p) => p.donkiId.startsWith("MOCK-"));
    if (ev.dataStatus === "mock" && !mockIds)
      ctx.addIssue({ code: "custom", message: "un mock solo puede llevar IDs MOCK-" });
    if (ev.dataStatus === "curated" && ev.phases.some((p) => p.donkiId.startsWith("MOCK-")))
      ctx.addIssue({ code: "custom", message: "un evento curado no puede llevar IDs MOCK-" });
    if (ev.startTime > ev.endTime)
      ctx.addIssue({ code: "custom", message: "startTime después de endTime" });
  });

export type SpaceWeatherEvent = z.infer<typeof SpaceWeatherEvent>;
export type Phase = z.infer<typeof Phase>;
