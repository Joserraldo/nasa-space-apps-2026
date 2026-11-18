/**
 * Ciclo del día en la escena (Frente D, D3). Dueño: Frente D. Lleva la luz y el cielo al momento de la
 * fase de la misión (`cicloDia.ts`): día, tarde durante la tormenta y atardecer azulado al final, sin
 * noche. Cambia de a poco (unos segundos); con movimiento reducido, de golpe. No toca recursos.
 * Corre antes que `entornoCielo` y `sombraSol` (orden por nombre), que usan el cielo y el Sol de este fotograma.
 *
 * `forzarMomento` existe solo para la vista previa (`?momento=noche|atardecer|dia`, Etapa A): el juego nunca lo llama.
 */
import { AJUSTE_CALIDAD } from "../calidad";
import { fijarDireccionSol } from "../cielo";
import { acercarMomento, luzDelMomento, momentoDeFase, type MomentoDia } from "../cicloDia";
import type { ContextoSistema, SistemaEscena } from "../escena3d";
import { cargarEstrellas } from "../estrellas";

/** Distancia del Sol al blanco (la misma que usa `cielo.ts`). */
const DISTANCIA_SOL = 150;

let forzado: MomentoDia | null = null;

/** Vista previa: fija el momento del día sin pasar por la fase. `null` vuelve a la fase. */
export function forzarMomento(m: MomentoDia | null): void {
  forzado = m;
}

/** Aplica la luz de un momento al cielo de la escena. `conEntorno`: el cielo PMREM ya rellena las sombras. */
export function aplicarMomento(ctx: Pick<ContextoSistema, "cielo" | "escena">, m: MomentoDia, conEntorno = false): void {
  const l = luzDelMomento(m);
  const { sol, hemisferica } = ctx.cielo;
  fijarDireccionSol(l.direccion.x, l.direccion.y, l.direccion.z);
  sol.position.copy(sol.target.position).addScaledVector(l.direccion, DISTANCIA_SOL);
  sol.color.copy(l.colorSol);
  sol.intensity = l.intensidadSol;
  hemisferica.color.copy(l.colorCieloHemi);
  hemisferica.groundColor.copy(l.colorSueloHemi);
  hemisferica.intensity = conEntorno ? l.intensidadHemiConEntorno : l.intensidadHemi;
  ctx.cielo.pintar(l.cielo);
  if (l.noche > 0) void cargarEstrellas(ctx.cielo);
}

export function crearSistema(): SistemaEscena {
  let actual: MomentoDia | null = null;
  let entornoActual: boolean | null = null;
  return {
    id: "ciclo-dia",
    montar() {},
    actualizar(dt: number, ctx: ContextoSistema) {
      const objetivo = forzado ?? momentoDeFase(ctx.vista?.fase);
      const siguiente = actual === null || ctx.reducido ? objetivo : acercarMomento(actual, objetivo, dt);
      const conEntorno = AJUSTE_CALIDAD[ctx.calidad].entorno;
      if (siguiente === actual && conEntorno === entornoActual) return;
      actual = siguiente;
      entornoActual = conEntorno;
      aplicarMomento(ctx, actual, conEntorno);
    },
    dispose() {
      // Deja la dirección del Sol de día para la próxima escena (estado del módulo `cielo`).
      const l = luzDelMomento(0);
      fijarDireccionSol(l.direccion.x, l.direccion.y, l.direccion.z);
    },
  };
}
