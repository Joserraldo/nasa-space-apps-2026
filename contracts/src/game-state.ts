import { z } from "zod";
import { ActionSchema, EquipmentSchema, ExpertSchema, ResourceSchema } from "./action.js";
import { DifficultySchema, MissionGoalSchema, SeedSchema, SiteSchema } from "./seed.js";
import { SpaceWeatherEventSchema } from "./space-weather.js";

export const Pct = z.number().min(0).max(100);

export const ResourcesSchema = z.object({
  energia: Pct,
  soporte_vital: Pct,
  blindaje: Pct,
});
export type Resources = z.infer<typeof ResourcesSchema>;

/** Nivel de la IA de la base (PLAN §2.4). */
export const BaseAiLevelSchema = z.enum(["tutorial", "pistas", "danada", "offline"]);
export type BaseAiLevel = z.infer<typeof BaseAiLevelSchema>;

export const CrewMemberSchema = z.object({
  id: ExpertSchema,
  disponible: z.boolean(),
  /** Sesgo de personalidad -1..1, sorteado por semilla. */
  sesgo: z.number().min(-1).max(1),
  /** Dosis acumulada en mSv (valor derivado de data/, con fuente). */
  dosisMSv: z.number().nonnegative(),
});
export type CrewMember = z.infer<typeof CrewMemberSchema>;

/** Origen de un cambio: decisión del niño o mala suerte (PLAN §2.5). */
export const CauseOriginSchema = z.enum(["decision", "mala_suerte", "sistema"]);
export type CauseOrigin = z.infer<typeof CauseOriginSchema>;

export const CauseSchema = z.object({
  tick: z.number().int().nonnegative(),
  origen: CauseOriginSchema,
  /** Clave i18n; el motor no contiene texto visible. */
  descripcionKey: z.string(),
  recurso: ResourceSchema.optional(),
  delta: z.number().optional(),
  accion: ActionSchema.optional(),
});
export type Cause = z.infer<typeof CauseSchema>;

/** Efecto con retraso: se aplica cuando tick actual >= aplicaEnTick. */
export const PendingEffectSchema = z.object({
  id: z.string(),
  aplicaEnTick: z.number().int().nonnegative(),
  recurso: ResourceSchema,
  delta: z.number(),
  origen: CauseOriginSchema,
  descripcionKey: z.string(),
  /** En hardcore los efectos pueden ser ocultos para la UI. */
  oculto: z.boolean().default(false),
});
export type PendingEffect = z.infer<typeof PendingEffectSchema>;

export const EquipmentStatusSchema = z.enum(["ok", "averiado", "destruido"]);
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

export const OrbitSchema = z.object({
  alturaKm: z.number().positive(),
  /** Franja de cobertura/comunicación 0-1. */
  franja: z.number().min(0).max(1),
  bateriaPct: Pct,
  senalPct: Pct,
  escudoPct: Pct,
});
export type Orbit = z.infer<typeof OrbitSchema>;

/** Métricas que alimentan la IA adaptativa. Se calculan por reglas del estado, nunca por azar. */
export const PerformanceSchema = z.object({
  /** Ticks seguidos con todos los recursos sanos. */
  rachaAciertos: z.number().int().nonnegative(),
  /** Ticks recientes con algún recurso en peligro. */
  erroresRecientes: z.number().int().nonnegative(),
  /** Ticks seguidos sin tomar una decisión. */
  ticksSinAccion: z.number().int().nonnegative(),
});
export type Performance = z.infer<typeof PerformanceSchema>;

export const GameStateSchema = z.object({
  version: z.string(),
  seed: SeedSchema,
  sitio: SiteSchema,
  dificultad: DifficultySchema,
  objetivo: MissionGoalSchema,
  tick: z.number().int().nonnegative(),
  dia: z.number().int().positive(),
  pausado: z.boolean(),
  recursos: ResourcesSchema,
  equipos: z.record(EquipmentSchema, EquipmentStatusSchema),
  tripulacion: z.array(CrewMemberSchema),
  iaBase: BaseAiLevelSchema,
  rendimiento: PerformanceSchema,
  tormenta: SpaceWeatherEventSchema.nullable(),
  orbita: OrbitSchema.nullable(),
  efectosPendientes: z.array(PendingEffectSchema),
  causas: z.array(CauseSchema),
  /** Usos restantes del "¿y si...?" (PLAN §2.6); null = ilimitado. */
  simulacionesRestantes: z.number().int().nonnegative().nullable(),
  /** Estado interno del RNG (entero sin signo de 32 bits). Nunca Math.random. */
  rngEstado: z.number().int().nonnegative(),
  resultado: z.enum(["en_curso", "exito", "fallo"]),
});
export type GameState = z.infer<typeof GameStateSchema>;
