import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "../liberar";
import { GRAVILLA } from "./terrenoDatos";
import { CAPAS_MONTANA, MONTANAS, contarRender, crearGravilla, crearMontanas, crearRocas, crearTerreno } from "./terrenoVisual";

const plano = (n = 9) => ({ alturas: new Float32Array(n * n), ancho: n, alto: n });

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

  it("la gravilla es UN InstancedMesh sin sombra, de pocas caras, determinista y fuera de `excluir`", () => {
    const materiales = crearMateriales();
    const r = plano();
    const terreno = crearTerreno(materiales, { rejilla: r, malla: { metrosPorPixel: 15, escalaVertical: 1, tamañoMundo: 120 } });
    const excluir = (x: number, z: number) => x > 0 && Math.abs(z) < 10;
    const g = crearGravilla(materiales, terreno, { excluir });
    expect(g).toBeInstanceOf(THREE.InstancedMesh);
    expect(g.name).toBe("Rocks_Gravel");
    expect(g.castShadow).toBe(false);
    expect(g.count).toBeGreaterThan(GRAVILLA.n * 0.7);
    expect(g.count).toBeLessThanOrEqual(GRAVILLA.n);
    const solo = new THREE.Group();
    solo.add(g);
    const c = contarRender(solo);
    expect(c.drawCalls).toBe(1);
    expect(c.triangulos / g.count).toBeLessThanOrEqual(8);
    const mt = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (let i = 0; i < g.count; i++) {
      g.getMatrixAt(i, mt);
      p.setFromMatrixPosition(mt);
      s.setFromMatrixScale(mt);
      expect(excluir(p.x, p.z)).toBe(false);
      expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(GRAVILLA.radioMin - 1e-6);
      expect(Math.max(s.x, s.z)).toBeLessThan(0.5);
    }
    const otra = crearGravilla(materiales, terreno, { excluir });
    expect(Array.from(otra.instanceMatrix.array)).toEqual(Array.from(g.instanceMatrix.array));
    liberarEscena(solo, { compartidos: true });
    liberarMateriales(Object.values(materiales));
    liberarCache();
  });

  it("la cordillera tiene varias capas: la lejana más alta y más clara que la cercana", () => {
    const materiales = crearMateriales();
    const m = crearMontanas(materiales);
    expect(CAPAS_MONTANA.length).toBeGreaterThanOrEqual(3);
    const pos = m.geometry.getAttribute("position");
    const col = m.geometry.getAttribute("color");
    const radios = CAPAS_MONTANA.map((c) => c.radio);
    const capa = (i: number) => {
      const r = Math.hypot(pos.getX(i), pos.getZ(i)) / MONTANAS.radio;
      let k = 0;
      for (let j = 1; j < radios.length; j++) if (Math.abs(r - radios[j]!) < Math.abs(r - radios[k]!)) k = j;
      return k;
    };
    const alto = radios.map(() => 0);
    const suma = radios.map(() => 0);
    const cuenta = radios.map(() => 0);
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) <= 0) continue;
      const k = capa(i);
      alto[k] = Math.max(alto[k]!, pos.getY(i));
      suma[k] = suma[k]! + col.getX(i) + col.getY(i) + col.getZ(i);
      cuenta[k] = cuenta[k]! + 1;
    }
    expect(alto[2]!).toBeGreaterThan(alto[0]!);
    expect(suma[2]! / cuenta[2]!).toBeGreaterThan(suma[0]! / cuenta[0]!);
    liberarEscena(m, { compartidos: true });
    liberarMateriales(Object.values(materiales));
  });
});
