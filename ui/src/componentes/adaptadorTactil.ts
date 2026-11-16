import type { EntradaTactil, ZonaTactil } from "../escena/entradaTactil.js";

/**
 * Lado DOM de los gestos de ESCENAS §3.5, sin React: decide la zona de cada dedo y le pasa los
 * punteros a la `EntradaTactil` que entrega la escena. Mitad izquierda mueve, mitad derecha mira.
 * Cada `pointerId` queda en la zona donde tocó hasta que se levanta (la clase de la escena lo guarda).
 */
export interface PunteroTactil {
  pointerId: number;
  clientX: number;
  clientY: number;
}

export function zonaDe(x: number, caja: { left: number; width: number }): ZonaTactil {
  return x < caja.left + caja.width / 2 ? "mover" : "mirar";
}

export class AdaptadorTactil {
  constructor(private readonly entrada: EntradaTactil, private readonly ahora: () => number = () => performance.now()) {}

  /** Devuelve true si el dedo quedó asignado (la capa debe capturar el puntero). */
  abajo(p: PunteroTactil, caja: { left: number; width: number }): boolean {
    return this.entrada.iniciar(p.pointerId, p.clientX, p.clientY, zonaDe(p.clientX, caja), this.ahora());
  }
  mover(p: PunteroTactil): void { this.entrada.mover(p.pointerId, p.clientX, p.clientY); }
  arriba(p: PunteroTactil): void { this.entrada.terminar(p.pointerId, this.ahora()); }
  cancelado(p: PunteroTactil): void { this.entrada.terminar(p.pointerId, this.ahora(), true); }
  soltarTodo(): void { this.entrada.cancelar(); }
}

/** Mitad del lado de la base del joystick (112 px): su centro queda bajo el pulgar. */
export const MITAD_BASE_JOYSTICK = 56;
