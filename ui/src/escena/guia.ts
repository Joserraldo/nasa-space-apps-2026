/**
 * Iris como guía de campo. Pura: decide a dónde rueda y hacia dónde mira; no toca recursos ni
 * elige por el niño. Acompaña, guía hasta un lugar que el niño eligió, y espera si se queda atrás.
 */
export type ModoGuia = "acompana" | "guia" | "espera" | "llego";

export interface Guia {
  x: number;
  z: number;
  /** Rumbo en radianes (0 = hacia +Z). */
  rumbo: number;
  modo: ModoGuia;
  /** Velocidad de este paso en m/s, para girar las ruedas según la distancia recorrida. */
  vel: number;
}

export interface Punto {
  x: number;
  z: number;
}

/** Si el jugador queda más lejos que esto, Iris se detiene y lo mira. */
export const DISTANCIA_ESPERA = 6.5;
/** Vuelve a avanzar cuando el jugador se acerca a esto. */
export const DISTANCIA_REANUDA = 3.6;
const VEL_GUIA = 3.1;
const VEL_ACOMPANA = 4.6;
const LLEGADA = 0.45;
/** Iris se para a un costado del punto de uso para no taparlo. */
const COSTADO = 1.3;

function girar(actual: number, deseado: number, k: number): number {
  const d = ((((deseado - actual + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return actual + d * Math.min(1, k);
}

/** Dónde se estaciona Iris cuando guía a un destino. */
export function puestoDeGuia(destino: Punto): Punto {
  return { x: destino.x + COSTADO, z: destino.z + 0.4 };
}

export function pasoGuia(
  g: Guia,
  jugador: Punto & { rumbo: number },
  destino: (Punto & { mx: number; mz: number }) | null,
  dt: number,
  resolver: (p: Punto) => void,
): Guia {
  const distJugador = Math.hypot(jugador.x - g.x, jugador.z - g.z);
  const mirar = (p: Punto, k: number) => girar(g.rumbo, Math.atan2(p.x - g.x, p.z - g.z), k);

  let objetivo: Punto;
  let velMax: number;
  let modo: ModoGuia;
  if (destino) {
    objetivo = puestoDeGuia(destino);
    velMax = VEL_GUIA;
    const esperando = g.modo === "espera" ? distJugador > DISTANCIA_REANUDA : distJugador > DISTANCIA_ESPERA;
    if (esperando) return { ...g, modo: "espera", vel: 0, rumbo: mirar(jugador, dt * 5) };
    modo = "guia";
  } else {
    // Sin destino acompaña: un paso al costado y otro atrás del jugador.
    const a = jugador.rumbo;
    objetivo = { x: jugador.x + Math.cos(a) * 1.5 - Math.sin(a) * 0.6, z: jugador.z - Math.sin(a) * 1.5 - Math.cos(a) * 0.6 };
    velMax = VEL_ACOMPANA;
    modo = "acompana";
  }

  const dx = objetivo.x - g.x;
  const dz = objetivo.z - g.z;
  const d = Math.hypot(dx, dz);
  if (d <= LLEGADA) {
    // En su puesto: mira en tres cuartos hacia la cámara y el jugador para mostrar siempre el visor.
    const foco = { x: jugador.x, z: g.z + 2.2 };
    return { ...g, modo: destino ? "llego" : "acompana", vel: 0, rumbo: mirar(foco, dt * 8) };
  }
  const vel = Math.min(velMax, d * 2.4);
  const p = { x: g.x + (dx / d) * vel * dt, z: g.z + (dz / d) * vel * dt };
  resolver(p);
  return { x: p.x, z: p.z, modo, vel, rumbo: girar(g.rumbo, Math.atan2(dx, dz), dt * 7) };
}
