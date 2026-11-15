import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { crearMateriales } from "../materiales";
import { crearCorredor, corredorEntre } from "./corredores";
import { crearPlataformaNave } from "./nave";
import { crearRefugio } from "./refugio";
import { ESTACIONES, crearEstacion } from "./estaciones";
import { fusionar } from "./fusionar";

describe("planta: estaciones, corredores, plataforma y refugio", () => {
  const m = crearMateriales();
  it("cada pieza se fusiona sin perder material (Rock lleva color)", () => {
    const piezas = [crearPlataformaNave(m), crearRefugio(m), crearCorredor(m, 4), ...ESTACIONES.map((e) => crearEstacion(m, e.id))];
    for (const p of piezas) {
      const f = fusionar(p, "t");
      const slots = new Set(f.children.map((c) => ((c as THREE.Mesh).material as THREE.Material).name));
      let esperados = new Set<string>();
      p.traverse((o) => o instanceof THREE.Mesh && esperados.add((o.material as THREE.Material).name));
      expect(slots).toEqual(esperados);
    }
  });
  it("el corredor entre dos huellas deja hueco o devuelve null", () => {
    const a = { x: 0, z: 0, radio: 2 };
    expect(corredorEntre(a, { x: 10, z: 0, radio: 2 })!.largo).toBeCloseTo(6.5);
    expect(corredorEntre(a, { x: 4, z: 0, radio: 2 })).toBeNull();
  });
});
