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

/** Salida del clasificador (PLAN §2.3). Dueño: rol agentes. ~300 tokens, JSON estricto. */
export const ClassifierOutputSchema = z.object({
  experto: ExpertSchema,
  accion: z.string(),
  parametros: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  confianza: z.number().min(0).max(1),
});
export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>;

/** Umbral bajo el cual el personaje repregunta (PLAN §2.3). */
export const CONFIDENCE_THRESHOLD = 0.6;
