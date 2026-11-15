import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { MallaPavimento, barrer, pavimento, type PuntoPavimento } from "./pavimento";

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

describe("barrido con huecos y paredes", () => {
  const sumaAreas = (g: THREE.BufferGeometry) => areas(g).reduce((a, b) => a + b, 0);

  it("resta el hueco: un marco de 4 × 4 con hueco de 2 × 2 deja 12 m²", () => {
    const m = new MallaPavimento();
    m.caras(barrer([rectangulo(0, 0, 4, 4)], [rectangulo(1, 1, 2, 2)]), 0.1, new THREE.Color());
    expect(sumaAreas(m.geometria())).toBeCloseTo(12);
  });

  it("las paredes cubren todo el contorno (fuera y dentro del hueco) mirando hacia fuera", () => {
    const m = new MallaPavimento();
    m.paredes(barrer([rectangulo(0, 0, 4, 4)], [rectangulo(1, 1, 2, 2)]), 0, 0.5, new THREE.Color());
    const g = m.geometria();
    const p = g.getAttribute("position"), n = g.getAttribute("normal");
    let area = 0;
    for (let i = 0; i < p.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(p, i);
      const b = new THREE.Vector3().fromBufferAttribute(p, i + 1);
      const c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
      area += b.sub(a).cross(c.sub(a)).length() / 2;
      expect(n.getY(i)).toBeCloseTo(0);
      // Fuera de la región: lejos del centro en el borde exterior, hacia el centro en el hueco.
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3 - 2, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3 - 2;
      const exterior = Math.max(Math.abs(cx), Math.abs(cz)) > 1.5;
      expect(Math.sign(n.getX(i) * cx + n.getZ(i) * cz)).toBe(exterior ? 1 : -1);
    }
    // Perímetro exterior 16 m + hueco 8 m, por 0,5 m de alto.
    expect(area).toBeCloseTo(12);
  });

  it("no corta un tramo recto en franjas por culpa de huellas lejanas", () => {
    const m = new MallaPavimento();
    const lejanos = Array.from({ length: 10 }, (_, i): PuntoPavimento[] => [[20, i], [21, i + 0.5], [20, i + 0.7]]);
    m.caras(barrer([rectangulo(0, 0, 1, 10), ...lejanos]), 0, new THREE.Color());
    // 2 triángulos del rectángulo entero + 2 por cada triángulo lejano (partido en su vértice medio).
    expect(m.geometria().getAttribute("position").count / 3).toBe(2 + 10 * 2);
  });
});
