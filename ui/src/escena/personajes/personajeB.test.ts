import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { animar, GESTOS } from "./animaciones.js";
import { EXPRESIONES } from "./cabeza.js";
import { NINO_B } from "./cuerpoB.js";
import { FICHAS } from "./fichas.js";
import { CARAS_IRIS } from "./iris.js";
import { crearIrisB } from "./irisB.js";
import { HUESOS } from "./personaje.js";
import { crearPersonajeB } from "./personajeB.js";

describe("propuesta B: doctora", () => {
  it("el traje es una sola superficie cerrada y la cabeza otra", () => {
    const pj = crearPersonajeB("doctora");
    for (const pieza of ["traje", "cara"]) {
      const t = pj.topologia[pieza]!;
      expect(t.componentes, pieza).toBe(1);
      expect(t.aristasAbiertas, pieza).toBe(0);
      expect(t.aristasMultiples, pieza).toBe(0);
    }
    expect(pj.topologia.traje!.cuadrilateros).toBeGreaterThan(pj.topologia.traje!.triangulos * 5);
    pj.liberar();
  });

  it("cuesta tres llamadas de dibujo y menos de 4000 triangulos visibles", () => {
    const pj = crearPersonajeB("doctora");
    let llamadas = 0;
    let tris = 0;
    pj.grupo.traverseVisible((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      llamadas++;
      tris += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
    });
    expect(llamadas).toBe(3);
    expect(tris).toBeLessThan(4000);
    expect((pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh).skeleton.bones).toHaveLength(HUESOS.length);
    pj.liberar();
  });

  it("las normales del cuerpo apuntan hacia fuera en las piezas cerradas", () => {
    const pj = crearPersonajeB("doctora");
    const g = (pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh).geometry;
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const nv = new THREE.Vector3();
    let total = 0;
    let opuestas = 0;
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i);
      b.fromBufferAttribute(p, i + 1);
      c.fromBufferAttribute(p, i + 2);
      const cara = b.clone().sub(a).cross(c.clone().sub(a));
      if (cara.lengthSq() < 1e-16) continue;
      nv.fromBufferAttribute(n, i).add(new THREE.Vector3().fromBufferAttribute(n, i + 1)).add(new THREE.Vector3().fromBufferAttribute(n, i + 2));
      total++;
      // Un cuadrilátero alabeado puede tener un triángulo algo torcido respecto de la normal de su cara: se tolera el pliegue, no la cara vuelta.
      if (cara.normalize().dot(nv.normalize()) < 0.2) opuestas++;
    }
    expect(total).toBeGreaterThan(1500);
    expect(opuestas).toBeLessThanOrEqual(4);
    pj.liberar();
  });

  it("ojos, cejas y boca quedan por delante de la piel, tambien en el interior de sus triangulos", () => {
    const pj = crearPersonajeB("doctora");
    const g = (pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh).geometry;
    // Malla estática solo con la geometría del cuerpo, en altos de cráneo, para lanzar rayos.
    const u = 0.265;
    const cy = 0.8245;
    const cuerpo = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const rayo = new THREE.Raycaster();
    const frente = (x: number, y: number): number => {
      rayo.set(new THREE.Vector3(x * u, cy + y * u, 5), new THREE.Vector3(0, 0, -1));
      // Gafas, nariz y pelo también son cuerpo: se toma la piel, que es el impacto más profundo de la cara.
      const impactos = rayo.intersectObject(cuerpo).filter((h) => h.point.z > 0);
      return Math.min(...impactos.map((h) => h.point.z)) / u;
    };
    let minimo = Infinity;
    for (const e of EXPRESIONES) {
      pj.expresion(e);
      const cara = pj.rostro.grupo.children.find((o) => o.visible) as THREE.Mesh;
      const p = cara.geometry.getAttribute("position");
      expect(p.count).toBeGreaterThan(0);
      const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      for (let i = 0; i < p.count; i += 3) {
        v.forEach((q, k) => q.fromBufferAttribute(p, i + k));
        const muestras = [...v, v[0]!.clone().add(v[1]!).add(v[2]!).multiplyScalar(1 / 3), v[0]!.clone().lerp(v[1]!, 0.5), v[1]!.clone().lerp(v[2]!, 0.5), v[2]!.clone().lerp(v[0]!, 0.5)];
        for (const m of muestras) minimo = Math.min(minimo, m.z - frente(m.x, m.y));
      }
    }
    expect(minimo).toBeGreaterThan(0.001);
    pj.liberar();
  });

  it("los gestos no reconstruyen buffers, no rompen el esqueleto y reposo vuelve al origen", () => {
    const pj = crearPersonajeB("doctora");
    const antes: THREE.BufferGeometry[] = [];
    pj.grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) antes.push(o.geometry);
    });
    for (const g of GESTOS) {
      for (const t of [0, 0.37, 1.9, 12.4]) {
        animar(pj, g, t);
        pj.grupo.updateMatrixWorld(true);
        pj.grupo.traverse((o) => expect(o.matrixWorld.elements.every((x) => Number.isFinite(x))).toBe(true));
      }
    }
    const despues: THREE.BufferGeometry[] = [];
    pj.grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) despues.push(o.geometry);
    });
    expect(despues).toEqual(antes);
    animar(pj, "reposo", 0, { quieto: true });
    expect(pj.huesos.pelvis.position.y).toBeCloseTo(pj.reposoPelvis, 9);
    for (const par of ["brazo", "antebrazo", "mano", "muslo", "espinilla", "pie"] as const) {
      pj.grupo.updateMatrixWorld(true);
      const i = pj.huesos[`${par}I`].getWorldPosition(new THREE.Vector3());
      const d = pj.huesos[`${par}D`].getWorldPosition(new THREE.Vector3());
      expect(i.x).toBeCloseTo(-d.x, 6);
      expect(i.y).toBeCloseTo(d.y, 6);
    }
    pj.liberar();
  });
});

describe.each(["nino", "meteorologa", "ingeniera"] as const)("propuesta B: %s", (id) => {
  it("usa la misma construccion que la doctora: traje y cabeza cerrados, tres llamadas, menos de 4000 triangulos", () => {
    const pj = crearPersonajeB(id);
    for (const pieza of ["traje", "cara"]) {
      const t = pj.topologia[pieza]!;
      expect(t.componentes, pieza).toBe(1);
      expect(t.aristasAbiertas, pieza).toBe(0);
      expect(t.aristasMultiples, pieza).toBe(0);
    }
    let llamadas = 0;
    let tris = 0;
    pj.grupo.traverseVisible((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      llamadas++;
      tris += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
    });
    expect(llamadas).toBe(3);
    expect(tris).toBeLessThan(4000);
    expect((pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh).skeleton.bones).toHaveLength(HUESOS.length);
    pj.liberar();
  });

  it("tiene las ocho expresiones, cada una con su propia malla, y los gestos no rompen el esqueleto", () => {
    const pj = crearPersonajeB(id);
    const firmas = new Set<string>();
    for (const e of EXPRESIONES) {
      pj.expresion(e);
      const visibles = pj.rostro.grupo.children.filter((o) => o.visible) as THREE.Mesh[];
      expect(visibles).toHaveLength(1);
      const p = visibles[0]!.geometry.getAttribute("position");
      expect(p.count).toBeGreaterThan(0);
      firmas.add(`${p.count}:${Array.from(p.array).join(",")}`);
    }
    // hablaCerrada puede coincidir con neutral en un rostro sin ajustes; el resto debe ser distinto.
    expect(firmas.size).toBeGreaterThanOrEqual(7);
    for (const g of GESTOS) {
      animar(pj, g, 0.37);
      pj.grupo.updateMatrixWorld(true);
      pj.grupo.traverse((o) => expect(o.matrixWorld.elements.every((x) => Number.isFinite(x))).toBe(true));
    }
    animar(pj, "reposo", 0, { quieto: true });
    expect(pj.huesos.pelvis.position.y).toBeCloseTo(pj.reposoPelvis, 9);
    pj.liberar();
  });
});

describe("propuesta B: proporciones del niño", () => {
  it("conserva altura, casco, craneo y articulaciones de la pierna de la ficha A", () => {
    const a = FICHAS.nino.proporciones;
    const pj = crearPersonajeB("nino");
    expect(pj.altura).toBe(FICHAS.nino.altura);
    expect(NINO_B.casco.y).toBeCloseTo(a.casco.y, 6);
    expect(NINO_B.casco.rx).toBeCloseTo(a.casco.rx, 6);
    expect(NINO_B.casco.ry).toBeCloseTo(a.casco.ry, 6);
    expect(NINO_B.craneo.y).toBeCloseTo(a.craneo.y, 6);
    expect(NINO_B.craneo.alto).toBeCloseTo(a.craneo.alto, 6);
    for (const [b, ref] of [
      [NINO_B.cadera, a.cadera],
      [NINO_B.rodilla, a.articulacionRodilla],
      [NINO_B.tobillo, a.tobillo],
    ] as const) {
      expect(Math.abs(b[0] - ref[0])).toBeLessThan(0.006);
      expect(Math.abs(b[1] - ref[1])).toBeLessThan(0.006);
    }
    // Caja real de la malla: los pies tocan el suelo y nada sobresale del tope del casco.
    const g = (pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh).geometry;
    g.computeBoundingBox();
    expect(g.boundingBox!.min.y).toBeCloseTo(0, 3);
    expect(g.boundingBox!.max.y).toBeLessThan(a.casco.y + a.casco.ry);
    pj.liberar();
  });
});

describe("iris B", () => {
  it("chasis y ruedas son superficies cerradas, dos llamadas de dibujo y menos de 2000 triangulos", () => {
    const iris = crearIrisB();
    expect(iris.topologia.chasis!.componentes).toBe(1);
    for (const pieza of ["chasis", "ruedas", "pantalla", "paneles", "antena"]) {
      expect(iris.topologia[pieza]!.aristasAbiertas, pieza).toBe(0);
      expect(iris.topologia[pieza]!.aristasMultiples, pieza).toBe(0);
    }
    let llamadas = 0;
    let tris = 0;
    iris.grupo.traverseVisible((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      llamadas++;
      tris += o.geometry.getAttribute("position").count / 3;
    });
    expect(llamadas).toBe(2);
    expect(tris).toBeLessThan(2000);
    iris.liberar();
  });

  it("conserva las seis caras y las animaciones de Iris A, y pliega los paneles laterales", () => {
    const iris = crearIrisB();
    for (const c of CARAS_IRIS) {
      iris.cara(c);
      expect(iris.grupo.getObjectByName(`iris-cara-${c}`)!.visible).toBe(true);
    }
    iris.animar(1, { velocidad: 1 });
    expect(iris.huesos.ruedaDI.rotation.x).toBeGreaterThan(0);
    expect(iris.huesos.alaI.rotation.z).toBeLessThan(-1);
    expect(iris.huesos.alaD.rotation.z).toBeCloseTo(-iris.huesos.alaI.rotation.z, 9);
    iris.animar(1, { paneles: 1 });
    expect(iris.huesos.alaI.rotation.z).toBeCloseTo(0, 9);
    iris.animar(2, { velocidad: 1, quieto: true });
    expect(iris.huesos.ruedaDI.rotation.x).toBe(0);
    iris.animar(0.2, { averiada: true });
    expect(iris.huesos.antena.rotation.z).toBeCloseTo(0.5);
    iris.liberar();
    iris.liberar();
  });

  it("el equipo de mano cambia por gesto y liberar es idempotente en la tripulacion B", () => {
    const ing = crearPersonajeB("ingeniera");
    animar(ing, "reparar", 0.3);
    expect(ing.huesos.llave.parent).toBe(ing.huesos.manoD);
    expect(ing.huesos.llave.scale.x).toBe(1);
    animar(ing, "inspeccionar", 0.5);
    expect(ing.huesos.llave.scale.x).toBe(0);
    expect(ing.huesos.tableta.scale.x).toBe(1);
    ing.liberar();
    ing.liberar();

    const met = crearPersonajeB("meteorologa");
    animar(met, "observar", 0.2);
    expect(met.huesos.catalejo.scale.x).toBe(1);
    met.liberar();
  });
});
