import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "../liberar";
import { contarRender, crearRocas, crearTerreno } from "./terrenoVisual";

describe("render del terreno", () => {
  it("pinta terreno facetado y rocas instanciadas dentro del presupuesto", () => {
    const materiales = crearMateriales();
    const rejilla = { alturas: new Float32Array([0, 1, 2, 3]), ancho: 2, alto: 2 };
    const terreno = crearTerreno(materiales, { rejilla, malla: { metrosPorPixel: 1, escalaVertical: 1, tamañoMundo: 4 } });
    const rocas = crearRocas(materiales, terreno, 3, 42);
    const escena = new THREE.Group();
    escena.add(terreno.malla, rocas);
    expect(rocas.count).toBe(3);
    expect(contarRender(escena).drawCalls).toBe(2);
    liberarEscena(escena, { compartidos: true });
    liberarMateriales(Object.values(materiales));
    liberarCache();
  });
});
