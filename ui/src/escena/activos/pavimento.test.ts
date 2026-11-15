import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { pavimento, type PuntoPavimento } from "./pavimento";

const rectangulo = (x: number, z: number, w: number, h: number): PuntoPavimento[] =>
  [[x, z], [x + w, z], [x + w, z + h], [x, z + h]];

function areas(g: THREE.BufferGeometry): number[] {
  const p = g.getAttribute("position");
  const salida: number[] = [];
  for (let i = 0; i < p.count; i += 3) {
    salida.push(Math.abs((p.getX(i + 1) - p.getX(i)) * (p.getZ(i + 2) - p.getZ(i))
      - (p.getZ(i + 1) - p.getZ(i)) * (p.getX(i + 2) - p.getX(i))) / 2);
  }
  return salida;
}

describe("unión del pavimento", () => {
  it("cuenta una sola vez rectángulos duplicados y su zona de intersección", () => {
    const a = rectangulo(0, 0, 4, 3);
    const g = pavimento([a, a, rectangulo(2, 1, 4, 3)], new THREE.Color("#BDAFC4"));
    // 12 + 12 - (2 × 2), aunque el primer rectángulo esté duplicado.
    expect(areas(g).reduce((a, b) => a + b, 0)).toBeCloseTo(20);
    expect(areas(g).every(a => a > 1e-8)).toBe(true);
    const n = g.getAttribute("normal");
    for (let i = 0; i < n.count; i++) expect(n.getY(i)).toBeCloseTo(1);
  });

  it("corta donde se cruzan bordes inclinados sin sumar superficies superpuestas", () => {
    const g = pavimento([
      [[0, 0], [4, 0], [0, 4]],
      [[4, 0], [4, 4], [0, 0]],
    ], new THREE.Color("#BDAFC4"));
    // Dos triángulos de área 8, intersección triangular de área 4.
    expect(areas(g).reduce((a, b) => a + b, 0)).toBeCloseTo(12);
    expect(areas(g).every(a => a > 1e-8)).toBe(true);
  });

  it("conserva huecos entre polígonos separados y una altura única", () => {
    const g = pavimento([rectangulo(0, 0, 1, 1), rectangulo(3, 0, 1, 1)], new THREE.Color(), 0.04);
    expect(areas(g).reduce((a, b) => a + b, 0)).toBeCloseTo(2);
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) expect(p.getY(i)).toBeCloseTo(0.04);
  });
});
