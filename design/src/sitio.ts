import type { MissionGoal } from "@solar-shield/contracts";

/**
 * Puntaje de sitio con 3 criterios (datos los calcula desde Mars Trek en data/terreno/*):
 *   plano    = qué tan fácil es aterrizar y construir (inclinación del terreno en grados; 1 − inclinación/10°)
 *   luz      = cuánto sol llega (horizonte despejado)
 *   blindaje = cuánta protección natural dan las paredes del cráter
 * Los pesos dependen del objetivo de misión. Suman 1. Solo datos.
 */
export type CriterioSitio = "plano" | "luz" | "blindaje";

export const PESOS_SITIO: Record<MissionGoal, Record<CriterioSitio, number>> = {
  explorar: { plano: 0.4, luz: 0.3, blindaje: 0.3 },
  cultivar: { plano: 0.25, luz: 0.5, blindaje: 0.25 },
  reportar_tierra: { plano: 0.3, luz: 0.45, blindaje: 0.25 },
  rescatar_rover: { plano: 0.5, luz: 0.25, blindaje: 0.25 },
};

/** Rangos del puntaje total 0-1 para la pantalla final (claves i18n). */
export const RANGOS_SITIO: readonly { desde: number; key: string }[] = [
  { desde: 0.8, key: "sitio.rango.excelente" },
  { desde: 0.6, key: "sitio.rango.bueno" },
  { desde: 0.4, key: "sitio.rango.regular" },
  { desde: 0, key: "sitio.rango.arriesgado" },
];
