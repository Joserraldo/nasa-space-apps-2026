import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { LUZ, SOMBRA_SEGUIDA, centroSombra, seguirConSombra } from "../cielo";
import { puntoSeguido } from "./sombraSol";

describe("sombra que sigue al niño (D2)", () => {
  it("adelanta el centro hacia donde mira la cámara, solo en el suelo", () => {
    expect(puntoSeguido({ x: 2, z: 3 }, { x: 0, z: -2 })).toEqual({ x: 2, z: 3 - SOMBRA_SEGUIDA.adelante });
    expect(puntoSeguido({ x: 2, z: 3 }, { x: 0, z: 0 })).toEqual({ x: 2, z: 3 });
  });

  it("mueve la caja de a un píxel de sombra entero: dos puntos casi iguales dan el mismo centro", () => {
    const a = centroSombra(5, 5, 16, 512);
    const b = centroSombra(5.01, 5.01, 16, 512);
    // Solo puede cambiar la profundidad (a lo largo del rayo del Sol), que no hace temblar la sombra.
    const enPlano = b.clone().sub(a).cross(new THREE.Vector3(...LUZ.direccionSol));
    expect(enPlano.length()).toBeLessThan(1e-9);
    // El centro ajustado queda a menos de un píxel (diagonal) del punto pedido, en el plano de la luz.
    const paso = 32 / 512;
    expect(centroSombra(7.3, -4.1, 16, 512).distanceTo(new THREE.Vector3(7.3, 0, -4.1))).toBeLessThan(paso * Math.SQRT2);
  });

  it("pone el Sol en su dirección de siempre, a 150 m del centro, y achica la caja", () => {
    const sol = new THREE.DirectionalLight();
    const c = new THREE.Vector3(10, 0, -3);
    seguirConSombra(sol, c, 20);
    expect(sol.target.position.toArray()).toEqual(c.toArray());
    const dir = sol.position.clone().sub(c);
    expect(dir.length()).toBeCloseTo(150, 5);
    dir.normalize();
    LUZ.direccionSol.forEach((v, i) => expect(dir.getComponent(i)).toBeCloseTo(v, 5));
    expect([sol.shadow.camera.left, sol.shadow.camera.right, sol.shadow.camera.top, sol.shadow.camera.bottom]).toEqual([-20, 20, 20, -20]);
  });

  it("con la caja seguida, el píxel de sombra es al menos 2,5 veces más fino que con la fija", () => {
    // Antes: caja de 80 m con 512 px en `media`; ahora 32 m con 512 px.
    expect(80 / 512 / ((2 * SOMBRA_SEGUIDA.mediaCaja.media) / 512)).toBeGreaterThanOrEqual(2.5);
  });
});
