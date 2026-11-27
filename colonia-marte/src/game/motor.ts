/**
 * Único punto de entrada del juego al monorepo (plan §1.3): la vista y el resto de src/game importan
 * desde aquí, nunca con rutas hacia la raíz. Antes de compilar hace falta `npm ci` en la raíz.
 */
export * from "../../../engine/src/index";
export * from "../../../missions/src/index";
export type { Difficulty, GameState, Equipment, Resource, Action, Expert, BaseAiLevel } from "../../../contracts/src/index";
