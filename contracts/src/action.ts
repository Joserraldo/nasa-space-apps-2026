import { z } from "zod";

/** Los 3 recursos del juego (PLAN §2.1). Cada acción mueve al menos dos. */
export const ResourceSchema = z.enum(["energia", "soporte_vital", "blindaje"]);
export type Resource = z.infer<typeof ResourceSchema>;

export const ExpertSchema = z.enum([
  "ingeniera",
  "doctora",
  "meteorologa",
  "matematico",
  "control_mision",
]);
export type Expert = z.infer<typeof ExpertSchema>;

export const EquipmentSchema = z.enum([
  "panel_solar",
  "bateria",
  "reciclador_agua",
  "invernadero",
  "escudo",
  "antena",
  "ia_base",
]);
export type Equipment = z.infer<typeof EquipmentSchema>;

/**
 * Action: enum cerrado. Los costos viven en design/ (tablas), no aquí.
 * BORRADOR: la lista final la cierra el rol diseño.
 */
const BaseActionSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("esperar") }),
  z.object({
    tipo: z.literal("redistribuir_energia"),
    hacia: z.enum(["soporte_vital", "blindaje"]),
    cantidad: z.number().int().min(5).max(50),
  }),
  z.object({ tipo: z.literal("reparar"), equipo: EquipmentSchema }),
  z.object({ tipo: z.literal("subir_escudo"), nivel: z.number().int().min(1).max(3) }),
  z.object({ tipo: z.literal("refugiarse") }),
  z.object({ tipo: z.literal("salida_exterior"), objetivo: EquipmentSchema }),
  z.object({
    tipo: z.literal("ajustar_orbita"),
    deltaAlturaKm: z.number().int().min(-50).max(50),
  }),
]);
export type BaseAction = z.infer<typeof BaseActionSchema>;

/** "¿Y si...?" del Matemático: simula una acción base sin aplicarla. */
export const SimulateActionSchema = z.object({
  tipo: z.literal("simular"),
  accion: BaseActionSchema,
});

export const ActionSchema = z.union([BaseActionSchema, SimulateActionSchema]);
export type Action = z.infer<typeof ActionSchema>;
export type ActionType = Action["tipo"];

/**
 * Intenciones que el clasificador puede devolver (propuesta de agentes, docs/ideas/agentes.md §2).
 * Son lenguaje -> enum. Las que mueven el juego se mapean 1:1 a `Action` en agents/ (código, no aquí):
 *   repartir_energia -> redistribuir_energia · reparar -> reparar · ir_al_refugio -> refugiarse
 *   que_pasa_si -> simular. Las demás son consultas (el experto responde con plantilla) o control.
 */
export const ClassifierIntentSchema = z.enum([
  // Ingeniera
  "repartir_energia",
  "reparar",
  "estado_energia",
  // Doctora
  "estado_salud",
  "ir_al_refugio",
  "explicar_dosis",
  // Meteoróloga
  "pronostico",
  "explicar_evento",
  // Matemático
  "que_pasa_si",
  // Generales
  "ayuda",
  "repetir",
  "saludo",
  "fuera_de_tema",
]);
export type ClassifierIntent = z.infer<typeof ClassifierIntentSchema>;

/** Cantidades en palabras: el motor decide cuánto es cada una. El modelo nunca produce cifras. */
export const QuantityWordSchema = z.enum(["poco", "medio", "mucho"]);
export type QuantityWord = z.infer<typeof QuantityWordSchema>;

/** Salida del clasificador (PLAN §2.3). Dueño: rol agentes. ~300 tokens, JSON estricto. */
export const ClassifierOutputSchema = z.object({
  version: z.literal("0"),
  /** Quién responde. "ia_base" = la IA de la base en modo enrutador. */
  experto: z.union([ExpertSchema, z.literal("ia_base")]),
  accion: ClassifierIntentSchema,
  /** SOLO valores de enum como texto, nunca números libres. */
  parametros: z.record(z.string()).default({}),
  /** 0..1; bajo CONFIDENCE_THRESHOLD el personaje repregunta. */
  confianza: z.number().min(0).max(1),
  /** De dónde salió la clasificación (evals y estadísticas anónimas). */
  fuente: z.enum(["atajo", "regex", "modelo", "boton"]),
});
export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>;

/** Umbral bajo el cual el personaje repregunta (PLAN §2.3). */
export const CONFIDENCE_THRESHOLD = 0.6;

/** Salida segura cuando el JSON del modelo no valida: nunca rompe el juego. */
export const CLASSIFIER_FALLBACK: ClassifierOutput = {
  version: "0",
  experto: "ia_base",
  accion: "fuera_de_tema",
  parametros: {},
  confianza: 0,
  fuente: "modelo",
};
