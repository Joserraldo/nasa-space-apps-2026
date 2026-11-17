import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { COLORES } from "../estilos/tokens";
import { crearMateriales, geometriaBase } from "./materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "./liberar";

describe("materiales y recursos compartidos", () => {
  it("reutiliza geometrías y materiales facetados por slot", () => {
    const m = crearMateriales();
    const fabrica = () => new THREE.BoxGeometry(1, 1, 1);
    const g = geometriaBase("prueba-materiales", fabrica);
    expect(geometriaBase("prueba-materiales", fabrica)).toBe(g);
    for (const [slot, material] of Object.entries(m)) {
      const facetado = slot === "Rock" || slot === "Plant" || slot === "Hair" || slot === "Glass";
      expect(material.flatShading).toBe(facetado);
      expect(material.userData.compartido).toBe(true);
    }
    liberarMateriales(Object.values(m));
    liberarCache();
  });

  it("consume los tokens oficiales y conserva una identidad infantil por defecto", () => {
    const m = crearMateriales();
    expect(m.SuitBase.color.getHexString()).toBe(COLORES["traje-marfil"].slice(1).toLowerCase());
    expect(m.Skin.color.getHexString()).toBe(COLORES["piel-nino"].slice(1).toLowerCase());
    expect(m.Hair.color.getHexString()).toBe(COLORES["cabello-nino"].slice(1).toLowerCase());
    liberarMateriales(Object.values(m));
  });

  it("libera cada recurso una sola vez al desmontar la escena", () => {
    const m = crearMateriales();
    const g = geometriaBase("prueba-liberacion", () => new THREE.BoxGeometry(1, 1, 1));
    const escena = new THREE.Scene();
    escena.add(new THREE.Mesh(g, m.SuitBase));
    const veces = new Map<object, number>();
    for (const recurso of [g, ...Object.values(m)]) {
      veces.set(recurso, 0);
      (recurso as THREE.EventDispatcher<{ dispose: object }>).addEventListener("dispose", () => veces.set(recurso, veces.get(recurso)! + 1));
    }
    expect(liberarEscena(escena)).toEqual({ geometrias: 0, materiales: 0, texturas: 0 });
    liberarEscena(escena, { compartidos: true });
    liberarMateriales(Object.values(m));
    liberarCache();
    liberarEscena(escena, { compartidos: true });
    for (const n of veces.values()) expect(n).toBe(1);
  });
});
