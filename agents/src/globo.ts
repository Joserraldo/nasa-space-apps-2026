import type { BaseAiLevel } from "@solar-shield/contracts";
import type { Linea } from "./dialogo.js";

/**
 * Líneas cortas para el globo de Iris (tarea B1 de PLAN-JUGABILIDAD §4). Cada `Linea` es un globo:
 * ui la traduce y la escena la ancla sobre Iris (`GloboEscena` en ui/src/escena/frontera.ts).
 * Ninguna pasa de 2 renglones en 390 px (comprobado con agents/evals/medir-globo.mjs).
 *
 * Qué dice cada nivel:
 * - tutorial: dos globos, adónde ir (`ir`) y con quién hablar o qué hacer (`hacer`).
 * - pistas: un globo que solo sugiere; no nombra lugar ni experta.
 * - danada: un globo raro y gracioso, sin cifras ni consejos (el número falso vive en iris.ts).
 * - offline: un único globo fijo, igual en los 8 pasos: Iris carga en su dock y el niño decide solo.
 *   No da destino ni pista, coherente con `guiaIrisLugar`, que devuelve `null` en offline.
 *
 * Urgencias y avería revelada no entran aquí: para eso manda la línea de `guiaIrisLugar`.
 */
export const PASOS_GLOBO = 8;

const GLOBO_OFFLINE: Linea = { clave: "agentes.globo.offline" };

/** Globos del paso de Jezero (1 a 8) para el nivel de Iris. Paso fuera de rango: sin globo. */
export function lineasGlobo(paso: number, nivel: BaseAiLevel): Linea[] {
  if (!Number.isInteger(paso) || paso < 1 || paso > PASOS_GLOBO) return [];
  if (nivel === "offline") return [GLOBO_OFFLINE];
  if (nivel !== "tutorial") return [{ clave: `agentes.globo.${nivel}.paso${paso}` }];
  return [
    { clave: `agentes.globo.tutorial.paso${paso}.ir` },
    { clave: `agentes.globo.tutorial.paso${paso}.hacer` },
  ];
}

/** Bienvenida de Iris al entrar a la base. En offline Iris no saluda: queda el globo de carga. */
export function bienvenidaGlobo(nivel: BaseAiLevel = "tutorial"): Linea[] {
  if (nivel === "offline") return [GLOBO_OFFLINE];
  return [{ clave: "agentes.globo.bienvenida.hola" }, { clave: "agentes.globo.bienvenida.decides" }];
}
