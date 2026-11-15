import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "../liberar";
import { crearHabitat, crearTorreControl } from "./edificios";
import { instanciar } from "./instancias";
import { crearBaliza } from "./piezasComunes";

describe("instancias y edificios", () => {
  it("repite balizas por instancia y monta edificios reconocibles", () => {
    const m = crearMateriales();
    const balizas = instanciar(() => crearBaliza(m), [{ posicion: [0, 0, 0] }, { posicion: [4, 0, 0] }]);
    const mallas = balizas.children.filter((o): o is THREE.InstancedMesh => o instanceof THREE.InstancedMesh);
    expect(mallas.length).toBeGreaterThan(0);
    expect(mallas.every((o) => o.count === 2)).toBe(true);
    const habitat = crearHabitat(m), torre = crearTorreControl(m);
    expect(habitat.name).toBe("Building_Habitat");
    expect(torre.name).toBe("Building_Control");
    liberarEscena(balizas);
    liberarEscena(habitat);
    liberarEscena(torre);
    liberarMateriales(Object.values(m));
    liberarCache();
  });
});
