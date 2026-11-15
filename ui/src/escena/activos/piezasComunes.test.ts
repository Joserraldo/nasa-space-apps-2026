import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "../liberar";
import { crearAntena, crearConsola, crearPanelSolar, crearPuerta } from "./piezasComunes";

describe("kit común", () => {
  it("cada pieza tiene facetas legibles sin superar 300 triángulos", () => {
    const materiales = crearMateriales();
    const fabricas = [crearPuerta, crearConsola, crearPanelSolar, crearAntena];
    for (const fabrica of fabricas) {
      const pieza = fabrica(materiales);
      let triangulos = 0;
      pieza.traverse((o) => {
        if (o instanceof THREE.Mesh) triangulos += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
      });
      expect(triangulos, fabrica.name).toBeLessThan(300);
      liberarEscena(pieza);
    }
    liberarMateriales(Object.values(materiales));
    liberarCache();
  });
});
