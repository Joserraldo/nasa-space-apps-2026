/**
 * Ciclo del día en la escena (Frente D, D3). Dueño: Frente D. Lleva la luz y el cielo al momento de la
 * fase de la misión (`cicloDia.ts`): día, tarde durante la tormenta y atardecer azulado al final, sin
 * noche. Cambia de a poco (unos segundos); con movimiento reducido, de golpe. No toca recursos.
 * Corre antes que `sombraSol` (orden por nombre), que usa la misma dirección del Sol.
 */
import * as THREE from "three";
import { fijarDireccionSol, pintarDomo } from "../cielo";
import { acercarMomento, luzDelMomento, momentoDeFase, type MomentoDia } from "../cicloDia";
import type { ContextoSistema, SistemaEscena } from "../escena3d";

/** Distancia del Sol al blanco (la misma que usa `cielo.ts`). */
const DISTANCIA_SOL = 150;

/** Aplica la luz de un momento al cielo de la escena. */
export function aplicarMomento(ctx: Pick<ContextoSistema, "cielo" | "escena">, m: MomentoDia): void {
  const l = luzDelMomento(m);
  const { sol, hemisferica, niebla, domo } = ctx.cielo;
  fijarDireccionSol(l.direccion.x, l.direccion.y, l.direccion.z);
  sol.position.copy(sol.target.position).addScaledVector(l.direccion, DISTANCIA_SOL);
  sol.color.copy(l.colorSol);
  sol.intensity = l.intensidadSol;
  hemisferica.color.copy(l.colorCieloHemi);
  hemisferica.intensity = l.intensidadHemi;
  niebla.color.copy(l.niebla);
  if (ctx.escena.background instanceof THREE.Color) ctx.escena.background.copy(l.fondo);
  pintarDomo(domo.geometry, l.mezclaCielo, l.direccion);
}

export function crearSistema(): SistemaEscena {
  let actual: MomentoDia | null = null;
  return {
    id: "ciclo-dia",
    montar() {},
    actualizar(dt: number, ctx: ContextoSistema) {
      const objetivo = momentoDeFase(ctx.vista?.fase);
      const siguiente = actual === null || ctx.reducido ? objetivo : acercarMomento(actual, objetivo, dt);
      if (siguiente === actual) return;
      actual = siguiente;
      aplicarMomento(ctx, actual);
    },
    dispose() {
      // Deja la dirección del Sol de día para la próxima escena (estado del módulo `cielo`).
      const l = luzDelMomento(0);
      fijarDireccionSol(l.direccion.x, l.direccion.y, l.direccion.z);
    },
  };
}
