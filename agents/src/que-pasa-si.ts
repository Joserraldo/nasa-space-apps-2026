import { ResourceSchema, type Action, type GameState } from "@solar-shield/contracts";
import type { Dialogo, Linea } from "./dialogo.js";

/**
 * Matemático "¿Y si…?": compara los recursos antes y después de una acción.
 * Agentes no simula: los dos estados los calcula el motor (ui aplica la acción sobre una copia
 * y avanza los ticks que quiera). El Matemático solo lee la diferencia, así nunca inventa números.
 */
export function queSiMatematico(accion: Action, antes: GameState["recursos"], despues: GameState["recursos"]): Dialogo {
  const lineas: Linea[] = [{ clave: "agentes.matematico.calculo" }];
  for (const r of ResourceSchema.options) {
    const desde = Math.round(antes[r]);
    const hasta = Math.round(despues[r]);
    if (desde === hasta) continue;
    lineas.push({ clave: hasta > desde ? "agentes.matematico.sube" : "agentes.matematico.baja", vars: { recursoKey: `agentes.recurso.${r}`, desde, hasta } });
  }
  if (lineas.length === 1) lineas.push({ clave: "agentes.matematico.igual" });
  lineas.push({ clave: "agentes.matematico.decides" });
  return { experto: "matematico", prioridad: "consejo", lineas, accion };
}
