import type { Cause, GameState } from "@solar-shield/contracts";

/**
 * Compacta la cadena de causas para guardar la partida sin cambiar nada de lo que el motor lee de ella.
 *
 * El motor deriva de las causas los módulos colocados, el aterrizaje ya cobrado, las insignias,
 * el daño por origen y el mínimo histórico. Por eso no se recorta: solo se fusionan causas de
 * origen "sistema" (p. ej. `causa.consumo`, la que más crece, una o más por tick) con la anterior
 * del mismo tipo cuando:
 *  - tienen la misma clave, el mismo recurso, el mismo signo de delta y ninguna acción;
 *  - entre las dos no hay ninguna otra causa que toque ese recurso.
 * Así una racha monótona se vuelve un solo delta: el valor al final de la racha es el mismo,
 * el mínimo histórico es el mismo (en una racha monótona el mínimo está en un extremo) y la suma por
 * origen es la misma. Las causas "sistema" no salen en las destacadas del final.
 * La causa fusionada conserva el tick de la última.
 */
export function compactarCausas(estado: GameState): GameState {
  const out: Cause[] = [];
  /** Por recurso: índice en `out` de la última causa que tocó ese recurso. */
  const ultimaPorRecurso = new Map<string, number>();

  for (const c of estado.causas) {
    if (c.recurso && c.delta !== undefined && c.delta !== 0 && c.origen === "sistema" && !c.accion) {
      const i = ultimaPorRecurso.get(c.recurso);
      const prev = i === undefined ? undefined : out[i];
      if (
        prev &&
        prev.origen === "sistema" &&
        !prev.accion &&
        prev.descripcionKey === c.descripcionKey &&
        prev.delta !== undefined &&
        Math.sign(prev.delta) === Math.sign(c.delta)
      ) {
        out[i!] = { ...prev, tick: c.tick, delta: prev.delta + c.delta };
        continue;
      }
    }
    out.push(c);
    if (c.recurso) ultimaPorRecurso.set(c.recurso, out.length - 1);
  }

  return out.length === estado.causas.length ? estado : { ...estado, causas: out };
}
