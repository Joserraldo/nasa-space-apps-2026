import { z } from "zod";

/** Versión del contrato. Súbela en cada cambio incompatible. */
export const CONTRACTS_VERSION = "0.2.0";

/**
 * Seed: texto que determina todo el escenario (sitio, tormenta, averías,
 * objetivo, sesgos). Misma semilla + mismas acciones = misma partida.
 * Ej.: "2026-11-14" (semilla del día) o "luna-azul-42".
 */
export const SeedSchema = z.string().min(1).max(64);
export type Seed = z.infer<typeof SeedSchema>;

export const SiteSchema = z.enum([
  "marte_jezero",
  "marte_polo_norte",
  "luna_polo_sur",
  "luna_lado_visible",
  "outpost_sorpresa",
]);
export type Site = z.infer<typeof SiteSchema>;

export const DifficultySchema = z.enum(["facil", "media", "dificil", "hardcore"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const MissionGoalSchema = z.enum([
  "explorar",
  "cultivar",
  "reportar_tierra",
  "rescatar_rover",
]);
export type MissionGoal = z.infer<typeof MissionGoalSchema>;
