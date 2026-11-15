import { montarVineta, type ArmarVineta, type EscenarioVineta } from "./escenario";
import { vineta1 } from "./vinetas";

/** Viñetas 3D por número (1 a 4). Las que todavía no tienen escena usan la tarjeta DOM. */
const VINETAS: Readonly<Record<number, ArmarVineta>> = { 1: vineta1 };

export function montarIntro(lienzo: HTMLCanvasElement, n: number, quieto: boolean): EscenarioVineta {
  const armar = VINETAS[n];
  if (!armar) throw new Error(`viñeta ${n} sin escena 3D`);
  return montarVineta(lienzo, armar, quieto);
}
