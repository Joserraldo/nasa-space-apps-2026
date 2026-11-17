import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { limitarSombras } from "./sombras";

const malla = (nombre: string, geo: THREE.BufferGeometry = new THREE.BoxGeometry()) => {
  const m = new THREE.Mesh(geo);
  m.name = nombre;
  m.castShadow = true;
  return m;
};

describe("limitarSombras", () => {
  it("turns off small pieces and module trims, keeps buildings, module bodies and crew", () => {
    const raiz = new THREE.Group();
    const piezas = {
      andamio: malla("Scaffold_Accent"),
      baliza: malla("Kit_Beacon_SuitBase"),
      trim: malla("Module_Shield_Boots"), // a box: 12 triangles
      cuerpoModulo: malla("Module_Greenhouse_SuitBase", new THREE.SphereGeometry(1, 32, 16)),
      edificios: malla("Base_Buildings_SuitBase"),
      nino: malla("cuerpo"),
    };
    raiz.add(...Object.values(piezas));
    expect(limitarSombras(raiz)).toBe(3);
    expect(piezas.andamio.castShadow || piezas.baliza.castShadow || piezas.trim.castShadow).toBe(false);
    expect(piezas.cuerpoModulo.castShadow && piezas.edificios.castShadow && piezas.nino.castShadow).toBe(true);
  });
});
