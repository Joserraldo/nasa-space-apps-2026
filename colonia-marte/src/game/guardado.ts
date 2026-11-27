/** Partida guardada en `colonia.progress.*` (Ajustes la borra con «Reset progress»). */
import { GameStateSchema } from "../../../contracts/src/index";
import { CAPITULOS } from "./historia";
import type { Juego } from "./flujo";

export const CLAVE_PARTIDA = "colonia.progress.partida";

export function guardar(almacen: Pick<Storage, "setItem">, juego: Juego): void {
  // La intro no se guarda: al volver se ve desde el principio.
  if (juego.fase === "intro") return;
  try { almacen.setItem(CLAVE_PARTIDA, JSON.stringify(juego)); } catch { /* Sin espacio o bloqueado: se sigue jugando. */ }
}

/** La partida guardada, o null si no hay o no sirve. */
export function cargar(almacen: Pick<Storage, "getItem">): Juego | null {
  try {
    const j = JSON.parse(almacen.getItem(CLAVE_PARTIDA) ?? "null") as Juego | null;
    if (!j || j.version !== 1 || !["tarjeta", "escena", "resultado"].includes(j.fase)) return null;
    const capitulo = CAPITULOS[j.capitulo];
    if (!capitulo || !Number.isInteger(j.escena) || !capitulo.escenas[j.escena]) return null;
    if (![null, "refugio", "escudo"].includes(j.plan) || !Number.isInteger(j.intento)) return null;
    const partida = GameStateSchema.safeParse(j.partida);
    return partida.success ? { ...j, partida: partida.data } : null;
  } catch {
    return null;
  }
}

export function borrar(almacen: Pick<Storage, "removeItem">): void {
  try { almacen.removeItem(CLAVE_PARTIDA); } catch { /* Nada que hacer. */ }
}
