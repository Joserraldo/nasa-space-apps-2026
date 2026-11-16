import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { animar, cadenciaCaminar, GESTOS } from "./animaciones.js";
import { EXPRESIONES } from "./cabeza.js";
import { NINO_B } from "./cuerpo.js";
import { FICHAS, type IdPersonaje } from "./fichas.js";
import { CARAS_IRIS, crearIris } from "./iris.js";
import { crearPersonaje, HUESOS } from "./personaje.js";

const IDS = Object.keys(FICHAS) as IdPersonaje[];

/** Mallas que se dibujan a la vez: lo que cuenta contra el presupuesto de llamadas de dibujo. */
function mallasVisibles(raiz: THREE.Object3D): number {
  let n = 0;
  raiz.traverseVisible((o) => {
    if (o instanceof THREE.Mesh) n++;
  });
  return n;
}

function sinNaN(raiz: THREE.Object3D): boolean {
  let ok = true;
  raiz.updateMatrixWorld(true);
  raiz.traverse((o) => {
    if (o.matrixWorld.elements.some((v) => !Number.isFinite(v))) ok = false;
  });
  return ok;
}

describe("tripulantes", () => {
  it.each(IDS)("%s tiene traje y cabeza en superficies cerradas, 3 llamadas y menos de 4000 triangulos", (id) => {
    const pj = crearPersonaje(id);
    for (const pieza of ["traje", "cara"]) {
      const t = pj.topologia[pieza]!;
      expect(t.componentes, pieza).toBe(1);
      expect(t.aristasAbiertas, pieza).toBe(0);
      expect(t.aristasMultiples, pieza).toBe(0);
    }
    expect(pj.topologia.traje!.cuadrilateros).toBeGreaterThan(pj.topologia.traje!.triangulos * 5);
    expect(mallasVisibles(pj.grupo)).toBe(3);
    let tris = 0;
    pj.grupo.traverseVisible((o) => {
      if (o instanceof THREE.Mesh) tris += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
    });
    expect(tris).toBeLessThan(4000);
    const cuerpo = pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh;
    expect(cuerpo.skeleton.bones).toHaveLength(HUESOS.length);
    pj.liberar();
  });

  it.each(IDS)("%s muestra una sola expresion a la vez y tiene las 8 expresiones con malla propia", (id) => {
    const pj = crearPersonaje(id);
    const firmas = new Set<string>();
    for (const e of EXPRESIONES) {
      pj.expresion(e);
      expect(pj.rostro.actual()).toBe(e);
      const visibles = pj.rostro.grupo.children.filter((c) => c.visible) as THREE.Mesh[];
      expect(visibles).toHaveLength(1);
      const p = visibles[0]!.geometry.getAttribute("position");
      expect(p.count).toBeGreaterThan(0);
      firmas.add(`${p.count}:${Array.from(p.array).join(",")}`);
    }
    expect(firmas.size).toBeGreaterThanOrEqual(7);
    pj.liberar();
  });

  it.each(IDS)("%s: cada lado es el reflejo del otro", (id) => {
    const pj = crearPersonaje(id);
    for (const par of ["brazo", "antebrazo", "mano", "muslo", "espinilla", "pie"] as const) {
      const i = pj.huesos[`${par}I`].getWorldPosition(new THREE.Vector3());
      const d = pj.huesos[`${par}D`].getWorldPosition(new THREE.Vector3());
      expect(i.x).toBeCloseTo(-d.x, 6);
      expect(i.y).toBeCloseTo(d.y, 6);
      expect(i.z).toBeCloseTo(d.z, 6);
      expect(i.x).toBeGreaterThan(0);
    }
    pj.liberar();
  });

  it.each(IDS)("%s: ningun gesto reconstruye buffers ni rompe el esqueleto y reposo vuelve al origen", (id) => {
    const pj = crearPersonaje(id);
    const antes: THREE.BufferGeometry[] = [];
    pj.grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) antes.push(o.geometry);
    });
    for (const g of GESTOS) {
      for (const t of [0, 0.37, 1.9, 12.4]) {
        animar(pj, g, t);
        expect(sinNaN(pj.grupo)).toBe(true);
      }
    }
    const despues: THREE.BufferGeometry[] = [];
    pj.grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) despues.push(o.geometry);
    });
    expect(despues).toEqual(antes);
    animar(pj, "reposo", 0, { quieto: true });
    expect(pj.huesos.pelvis.position.y).toBeCloseTo(pj.reposoPelvis, 9);
    expect(pj.huesos.musloI.rotation.x).toBe(0);
    pj.liberar();
  });

  it("las normales del cuerpo apuntan hacia fuera en las piezas cerradas", () => {
    const pj = crearPersonaje("doctora");
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
      if (cara.normalize().dot(nv.normalize()) < 0.2) opuestas++;
    }
    expect(total).toBeGreaterThan(1500);
    expect(opuestas).toBeLessThanOrEqual(4);
    pj.liberar();
  });

  it("ojos, cejas y boca quedan por delante de la piel, tambien en el interior de sus triangulos", () => {
    const pj = crearPersonaje("doctora");
    const g = (pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh).geometry;
    const u = 0.265;
    const cy = 0.8245;
    const cuerpo = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    const rayo = new THREE.Raycaster();
    const frente = (x: number, y: number): number => {
      rayo.set(new THREE.Vector3(x * u, cy + y * u, 5), new THREE.Vector3(0, 0, -1));
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

  it("el niño conserva altura, casco, craneo y articulaciones de su ficha", () => {
    const a = FICHAS.nino.proporciones;
    const pj = crearPersonaje("nino");
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
    const g = (pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh).geometry;
    g.computeBoundingBox();
    expect(g.boundingBox!.min.y).toBeCloseTo(0, 3);
    expect(g.boundingBox!.max.y).toBeLessThan(a.casco.y + a.casco.ry);
    pj.liberar();
  });

  it("al arrodillarse la pelvis baja y la rodilla de apoyo queda cerca del suelo", () => {
    const pj = crearPersonaje("ingeniera");
    animar(pj, "arrodillarse", 0.3, { quieto: true });
    pj.grupo.updateMatrixWorld(true);
    const rodilla = pj.huesos.espinillaD.getWorldPosition(new THREE.Vector3());
    expect(rodilla.y).toBeGreaterThan(0);
    expect(rodilla.y).toBeLessThan(0.12);
    pj.liberar();
  });
});

describe("iris", () => {
  it("chasis y ruedas son superficies cerradas, 2 llamadas de dibujo y menos de 2000 triangulos", () => {
    const iris = crearIris();
    expect(iris.topologia.chasis!.componentes).toBe(1);
    for (const pieza of ["chasis", "ruedas", "pantalla", "paneles", "antena"]) {
      expect(iris.topologia[pieza]!.aristasAbiertas, pieza).toBe(0);
      expect(iris.topologia[pieza]!.aristasMultiples, pieza).toBe(0);
    }
    expect(mallasVisibles(iris.grupo)).toBe(2);
    let tris = 0;
    iris.grupo.traverseVisible((o) => {
      if (o instanceof THREE.Mesh) tris += o.geometry.getAttribute("position").count / 3;
    });
    expect(tris).toBeLessThan(2000);
    for (const c of CARAS_IRIS) {
      iris.cara(c);
      expect(mallasVisibles(iris.grupo)).toBe(2);
      expect(iris.grupo.getObjectByName(`iris-cara-${c}`)!.visible).toBe(true);
    }
    iris.liberar();
  });

  it("averiada muestra error o pantalla apagada, nunca la cara normal", () => {
    const iris = crearIris();
    for (const t of [0, 0.5, 1.1, 2.7]) {
      iris.animar(t, { averiada: true });
      const visible = iris.grupo.getObjectByName("iris")!;
      expect(sinNaN(visible)).toBe(true);
    }
    iris.animar(0.2, { averiada: true });
    expect(iris.huesos.antena.rotation.z).toBeCloseTo(0.5);
    iris.liberar();
  });

  it("las ruedas giran con la velocidad y los paneles laterales se pliegan", () => {
    const iris = crearIris();
    iris.animar(1, { velocidad: 0 });
    expect(iris.huesos.ruedaDI.rotation.x).toBe(0);
    iris.animar(1, { velocidad: 1 });
    expect(iris.huesos.ruedaDI.rotation.x).toBeGreaterThan(0);
    expect(iris.huesos.alaI.rotation.z).toBeLessThan(-1);
    expect(iris.huesos.alaD.rotation.z).toBeCloseTo(-iris.huesos.alaI.rotation.z, 9);
    iris.animar(1, { paneles: 1 });
    expect(iris.huesos.alaI.rotation.z).toBeCloseTo(0, 9);
    iris.liberar();
    iris.liberar();
  });
});

describe("continuación de gestos y accesibilidad", () => {
  it("quieto congela caminar, habla y ruedas sin depender del tiempo", () => {
    const p = crearPersonaje("nino");
    animar(p, "caminar", 0, { quieto: true });
    const x = p.huesos.musloI.rotation.x;
    animar(p, "caminar", 2, { quieto: true });
    expect(p.huesos.musloI.rotation.x).toBe(x);
    p.liberar();

    const i = crearIris();
    i.animar(2, { velocidad: 1, quieto: true });
    expect(i.huesos.ruedaDI.rotation.x).toBe(0);
    i.liberar();
  });

  it("el equipo sigue la mano y cambia según el gesto del rol, y liberar es idempotente", () => {
    const p = crearPersonaje("ingeniera");
    animar(p, "reparar", 0.3);
    expect(p.huesos.llave.parent).toBe(p.huesos.manoD);
    expect(p.huesos.llave.scale.x).toBe(1);
    animar(p, "inspeccionar", 0.5);
    expect(p.huesos.llave.scale.x).toBe(0);
    expect(p.huesos.tableta.scale.x).toBe(1);
    p.liberar();
    p.liberar();

    const m = crearPersonaje("meteorologa");
    animar(m, "observar", 0.2);
    expect(m.huesos.catalejo.scale.x).toBe(1);
    m.liberar();
  });
});

describe("paso según la rapidez (A4)", () => {
  const rot = (pj: ReturnType<typeof crearPersonaje>) => HUESOS.map((n) => pj.huesos[n].rotation.toArray().slice(0, 3).join(","));

  it("la cadencia crece con la rapidez y queda acotada", () => {
    expect(cadenciaCaminar(0)).toBeCloseTo(4.5);
    expect(cadenciaCaminar(1)).toBeCloseTo(10);
    expect(cadenciaCaminar(0.5)).toBeGreaterThan(cadenciaCaminar(0.2));
    expect(cadenciaCaminar(5)).toBe(cadenciaCaminar(1));
    expect(cadenciaCaminar(-1)).toBe(cadenciaCaminar(0));
  });

  it("sin fase ni ritmo el paso es el de siempre (las expertas no cambian)", () => {
    const a = crearPersonaje("nino"), b = crearPersonaje("nino");
    animar(a, "caminar", 0.37);
    animar(b, "caminar", 0.37, { fase: 0.37 * 6.2 });
    expect(rot(b)).toEqual(rot(a));
  });

  it("a la marcha el paso es más largo que al arrancar, y con movimiento reducido queda la pose clave", () => {
    const pj = crearPersonaje("nino");
    const fase = Math.PI / 2;
    animar(pj, "caminar", 0, { fase, ritmo: 0 });
    const corto = Math.abs(pj.huesos.musloI.rotation.x);
    animar(pj, "caminar", 0, { fase, ritmo: 1 });
    const largo = Math.abs(pj.huesos.musloI.rotation.x);
    expect(largo).toBeGreaterThan(corto * 1.4);
    animar(pj, "caminar", 0, { fase, ritmo: 1, quieto: true });
    expect(pj.huesos.musloI.rotation.x).toBeCloseTo(0, 6);
  });
});
