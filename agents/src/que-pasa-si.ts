import { ResourceSchema, type Action, type GameState } from "@solar-shield/contracts";
import type { Dialogo, Linea } from "./dialogo.js";

/**
 * Matemático "¿Y si…?": compara los recursos antes y después de una acción.
 * Agentes no simula: los dos estados los calcula el motor (ui aplica la acción sobre una copia
 * y avanza los ticks que quiera). El Matemático solo lee la diferencia, así nunca inventa números.
 */
function diferencias(antes: GameState["recursos"], despues: GameState["recursos"]): Linea[] {
  const lineas: Linea[] = [];
  for (const r of ResourceSchema.options) {
    const desde = Math.round(antes[r]);
    const hasta = Math.round(despues[r]);
    if (desde === hasta) continue;
    lineas.push({ clave: hasta > desde ? "agentes.matematico.sube" : "agentes.matematico.baja", vars: { recursoKey: `agentes.recurso.${r}`, desde, hasta } });
  }
  return lineas;
}

export function queSiMatematico(accion: Action, antes: GameState["recursos"], despues: GameState["recursos"]): Dialogo {
  const cambios = diferencias(antes, despues);
  const lineas: Linea[] = [{ clave: "agentes.matematico.calculo" }, ...(cambios.length ? cambios : [{ clave: "agentes.matematico.igual" }])];
  lineas.push({ clave: "agentes.matematico.decides" });
  return { experto: "matematico", prioridad: "consejo", lineas, accion };
}

/** Lo que el Matemático necesita de cada estado (los calcula el motor con `aplicarAccion`). */
export type VistaQueSi = Pick<GameState, "recursos" | "efectosPendientes" | "tick">;

export interface OpcionQueSi {
  accion: Action;
  /** Estado tras aplicar la acción sobre una copia de `antes`. */
  despues: VistaQueSi;
}

/**
 * Compara lado a lado las opciones de una escena (dilema del paso 6, polvo 4b).
 * Por opción: lo que cambia ya y, aparte, lo que el motor dejó pendiente para después (con cuántos ticks).
 * No trae `accion`: el jugador elige en los botones de la escena.
 */
export function compararOpciones(antes: VistaQueSi, opciones: readonly OpcionQueSi[]): Dialogo {
  const previos = new Set(antes.efectosPendientes.map((e) => e.id));
  const lineas: Linea[] = [{ clave: "agentes.matematico.compara" }];
  opciones.forEach(({ accion, despues }, i) => {
    lineas.push({ clave: "agentes.matematico.opcion", vars: { n: i + 1, accionKey: `agentes.accion.${accion.tipo}` } });
    const ya = diferencias(antes.recursos, despues.recursos);
    const luego: Linea[] = despues.efectosPendientes
      .filter((e) => !previos.has(e.id) && e.origen === "decision" && Math.round(e.delta) !== 0)
      .map((e) => ({
        clave: e.delta > 0 ? "agentes.matematico.luegoSube" : "agentes.matematico.luegoBaja",
        vars: { recursoKey: `agentes.recurso.${e.recurso}`, cantidad: Math.abs(Math.round(e.delta)), ticks: e.aplicaEnTick - antes.tick },
      }));
    lineas.push(...(ya.length || luego.length ? [...ya, ...luego] : [{ clave: "agentes.matematico.igual" }]));
  });
  lineas.push({ clave: "agentes.matematico.decides" });
  return { experto: "matematico", prioridad: "consejo", lineas };
}
