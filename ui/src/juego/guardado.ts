import { deserializarProgreso, serializarProgreso } from "./cuenta.js";
import { reducir, type Juego } from "./reductor.js";

/**
 * Partida guardada en el navegador ("Continue" de la portada, inicio/01).
 *
 * Vive en `localStorage`, nunca en un servidor: no hay datos personales. Reusa el empaquetado y
 * la validación de `cuenta.ts` (contrato `GameStateSchema`), así una partida vieja o dañada se
 * descarta en vez de romper el juego. Si el almacenamiento falla, el juego sigue sin guardar.
 */
export const CLAVE_PARTIDA = "solar-shield.partida.v1";

type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** El almacenamiento del navegador, o `undefined` si no existe o está bloqueado. */
export function almacenDelNavegador(): Almacen | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** Solo se puede continuar una partida que sigue en curso y ya salió de la portada. */
function esContinuable(j: Juego): boolean {
  return j.fase !== "inicio" && j.fase !== "final" && j.estado.resultado === "en_curso";
}

/**
 * Guarda la partida en curso. Al terminar (o al volver a la portada con una partida nueva) no
 * queda nada que continuar: una partida terminada se borra.
 */
export function guardarPartida(almacen: Almacen | undefined, j: Juego): void {
  if (!almacen || j.fase === "inicio") return;
  try {
    if (!esContinuable(j)) {
      almacen.removeItem(CLAVE_PARTIDA);
      return;
    }
    // Con la decisión de la tormenta ya registrada, se guarda el paso siguiente: al continuar
    // no se puede decidir dos veces.
    const datos = serializarProgreso(j.registro ? reducir(j, { tipo: "seguir" }) : j);
    if (datos) almacen.setItem(CLAVE_PARTIDA, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento la partida dura solo esta visita.
  }
}

/** Devuelve la partida guardada si es válida y se puede continuar; si no, `null`. */
export function cargarPartida(almacen: Almacen | undefined): Juego | null {
  try {
    const crudo = almacen?.getItem(CLAVE_PARTIDA);
    if (!crudo) return null;
    const j = deserializarProgreso(JSON.parse(crudo));
    return j && esContinuable(j) ? j : null;
  } catch {
    return null;
  }
}
