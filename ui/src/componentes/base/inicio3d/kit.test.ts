import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { encajar, modoInicio } from "./lienzo.js";
import { crearAsteroide, crearPlaneta, crearSombra, tubo } from "./piezas.js";

describe("kit de las ilustraciones de inicio", () => {
  it("encajar: la pieza entra entera en su caja, centrada y sin deformarse", () => {
    const marco = new THREE.Group();
    const caja = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1));
    marco.add(caja);
    // Caja de DISEÑO §6 para el niño en un lienzo de 1024 x 683.
    const s = encajar(marco, caja, { x: 49, y: 18, w: 31, h: 57 }, 1024, 683);
    const b = new THREE.Box3().setFromObject(marco);
    expect(b.max.x - b.min.x).toBeLessThanOrEqual(0.31 * 1024 + 1e-6);
    expect(b.max.y - b.min.y).toBeLessThanOrEqual(0.57 * 683 + 1e-6);
    expect(marco.scale.x).toBe(s);
    expect(marco.scale.y).toBe(s);
    const c = b.getCenter(new THREE.Vector3());
    expect(c.x).toBeCloseTo((0.49 + 0.155) * 1024, 3);
    expect(-c.y).toBeCloseTo((0.18 + 0.285) * 683, 3);
  });

  it("modo según las mismas reglas de inicio.css", () => {
    expect(modoInicio(1024, 683)).toBe("ancho");
    expect(modoInicio(844, 390)).toBe("horizontal");
    expect(modoInicio(390, 844)).toBe("vertical");
    expect(modoInicio(768, 1024)).toBe("vertical");
  });

  it("planeta en dos llamadas y asteroide en una, con color de vértice y caras planas", () => {
    expect(crearPlaneta().children).toHaveLength(2);
    const a = crearAsteroide(1, 2);
    expect(a.geometry.getAttribute("color")).toBeDefined();
    expect((a.material as THREE.MeshLambertMaterial).flatShading).toBe(true);
    expect(crearSombra().material).toBeInstanceOf(THREE.MeshBasicMaterial);
  });

  it("tubo: rehace la geometría del cable por puntos en px", () => {
    const m = new THREE.Mesh(new THREE.BufferGeometry());
    tubo(m, [[0, 0], [10, 20], [30, 40]], 0, 2);
    expect(m.geometry).toBeInstanceOf(THREE.TubeGeometry);
  });
});
