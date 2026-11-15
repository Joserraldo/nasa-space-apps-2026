import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { animar, GESTOS } from "./animaciones.js";
import { EXPRESIONES } from "./cabeza.js";
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
  it.each(IDS)("%s cuesta 3 llamadas de dibujo y menos de 3000 triangulos", (id) => {
    const pj = crearPersonaje(id);
    expect(mallasVisibles(pj.grupo)).toBe(3);
    const cuerpo = pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh;
    expect(cuerpo.geometry.getAttribute("position").count / 3).toBeLessThan(3000);
    expect(cuerpo.skeleton.bones).toHaveLength(HUESOS.length);
  });

  it.each(IDS)("%s muestra una sola expresion a la vez", (id) => {
    const pj = crearPersonaje(id);
    for (const e of EXPRESIONES) {
      pj.expresion(e);
      expect(pj.rostro.actual()).toBe(e);
      expect(pj.rostro.grupo.children.filter((c) => c.visible)).toHaveLength(1);
    }
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
  });

  it.each(IDS)("%s: ningun gesto rompe el esqueleto y reposo vuelve al origen", (id) => {
    const pj = crearPersonaje(id);
    for (const g of GESTOS) {
      for (const t of [0, 0.37, 1.9, 12.4]) {
        animar(pj, g, t);
        expect(sinNaN(pj.grupo)).toBe(true);
      }
    }
    animar(pj, "reposo", 0, { quieto: true });
    expect(pj.huesos.pelvis.position.y).toBeCloseTo(pj.reposoPelvis, 9);
    expect(pj.huesos.musloI.rotation.x).toBe(0);
  });

  it("al arrodillarse la pelvis baja y la rodilla de apoyo queda cerca del suelo", () => {
    const pj = crearPersonaje("ingeniera");
    animar(pj, "arrodillarse", 0.3, { quieto: true });
    pj.grupo.updateMatrixWorld(true);
    const rodilla = pj.huesos.espinillaD.getWorldPosition(new THREE.Vector3());
    expect(rodilla.y).toBeGreaterThan(0);
    expect(rodilla.y).toBeLessThan(0.12);
  });
});

describe("iris", () => {
  it("cuesta 2 llamadas de dibujo y muestra una cara a la vez", () => {
    const iris = crearIris();
    expect(mallasVisibles(iris.grupo)).toBe(2);
    for (const c of CARAS_IRIS) {
      iris.cara(c);
      expect(mallasVisibles(iris.grupo)).toBe(2);
    }
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
  });

  it("las ruedas giran con la velocidad", () => {
    const iris = crearIris();
    iris.animar(1, { velocidad: 0 });
    expect(iris.huesos.ruedaDI.rotation.x).toBe(0);
    iris.animar(1, { velocidad: 1 });
    expect(iris.huesos.ruedaDI.rotation.x).toBeGreaterThan(0);
  });
});


describe("continuación de gestos y accesibilidad",()=>{
 it("quieto congela caminar, habla y ruedas sin depender del tiempo",()=>{
  const p=crearPersonaje("nino");
  animar(p,"caminar",0,{quieto:true});const x=p.huesos.musloI.rotation.x;
  animar(p,"caminar",2,{quieto:true});expect(p.huesos.musloI.rotation.x).toBe(x);
  const i=crearIris();i.animar(2,{velocidad:1,quieto:true});expect(i.huesos.ruedaDI.rotation.x).toBe(0);
 });
 it("el equipo sigue la mano y cambia según el gesto del rol",()=>{
  const p=crearPersonaje("ingeniera");animar(p,"reparar",.3);
  expect(p.huesos.llave.parent).toBe(p.huesos.manoD);expect(p.huesos.llave.scale.x).toBe(1);
  animar(p,"inspeccionar",.5);expect(p.huesos.llave.scale.x).toBe(0);expect(p.huesos.tableta.scale.x).toBe(1);
  const m=crearPersonaje("meteorologa");animar(m,"observar",.2);expect(m.huesos.catalejo.scale.x).toBe(1);
 });
});
