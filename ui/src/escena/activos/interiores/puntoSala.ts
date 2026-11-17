/** Something in a room the kid bumps into or uses: a stable id, its centre and its collision radius (metres). */
export interface PuntoSala {
  /** Builder name with its index: stable id for the game to react to. */
  id: string;
  x: number;
  z: number;
  /** Collision radius in metres (0 = wall-mounted, no collision). */
  radio: number;
  interactivo: boolean;
}
