/**
 * Sombra del Sol que sigue al niño (Frente D, D2). Dueño: Frente D.
 * En cada fotograma centra la caja de sombra en el niño, adelantada hacia donde mira la cámara, y la
 * ajusta a la grilla de píxeles de sombra (`cielo.ts`). Sin sombras (calidad `baja`) no hace nada.
 * No toca recursos (MECANICAS §5).
 */
import * as THREE from "three";
import { SOMBRA_SEGUIDA, centroSombra, seguirConSombra } from "../cielo";
import type { ContextoSistema, SistemaEscena } from "../escena3d";

/** Centro de la caja: el niño más `adelante` metros hacia donde mira la cámara, en el suelo. */
export function puntoSeguido(jugador: { x: number; z: number }, mirada: { x: number; z: number }, adelante: number = SOMBRA_SEGUIDA.adelante): { x: number; z: number } {
  const largo = Math.hypot(mirada.x, mirada.z);
  if (largo < 1e-6) return { x: jugador.x, z: jugador.z };
  return { x: jugador.x + (mirada.x / largo) * adelante, z: jugador.z + (mirada.z / largo) * adelante };
}

export function crearSistema(): SistemaEscena {
  const mirada = new THREE.Vector3();
  const centro = new THREE.Vector3();
  return {
    id: "sombra-sol",
    montar() {},
    actualizar(_dt: number, ctx: ContextoSistema) {
      const sol = ctx.cielo.sol;
      if (!sol.castShadow) return;
      ctx.camara.getWorldDirection(mirada);
      const p = puntoSeguido(ctx.jugador, mirada);
      const media = SOMBRA_SEGUIDA.mediaCaja[ctx.calidad];
      seguirConSombra(sol, centroSombra(p.x, p.z, media, sol.shadow.mapSize.x, centro), media);
    },
    dispose() {},
  };
}
