import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { ContextoSistema } from "../escena3d";
import { CONTACTO, buscarPersonajes, crearSistema, escalaContacto } from "./sombraContacto";

function escenaConPersonajes(): THREE.Scene {
  const escena = new THREE.Scene();
  const tripulacion = new THREE.Group();
  for (const [nombre, x] of [["personaje-nino", 2], ["personaje-ingeniera", -3], ["iris", 5]] as const) {
    const g = new THREE.Group();
    g.name = nombre;
    g.position.set(x, 0, 1);
    g.add(new THREE.Group()); // un hijo cualquiera: no debe contarse como personaje
    tripulacion.add(g);
  }
  escena.add(tripulacion);
  return escena;
}

describe("sombra de contacto (D2)", () => {
  it("encuentra a cada personaje y a Iris, con su radio", () => {
    const p = buscarPersonajes(escenaConPersonajes());
    expect(p.map((x) => x.objeto.name)).toEqual(["personaje-nino", "personaje-ingeniera", "iris"]);
    expect(p.map((x) => x.radio)).toEqual([CONTACTO.radioPersona, CONTACTO.radioPersona, CONTACTO.radioIris]);
  });

  it("apoyado mide su radio entero y al saltar se achica, sin bajar de 0,4", () => {
    expect(escalaContacto(0)).toBe(1);
    expect(escalaContacto(-0.1)).toBe(1);
    expect(escalaContacto(0.5)).toBeLessThan(1);
    expect(escalaContacto(50)).toBe(0.4);
  });

  it("pone una mancha por personaje en el suelo, en una sola malla, y la libera al quitarse", () => {
    const escena = escenaConPersonajes();
    const ctx = { escena } as unknown as ContextoSistema;
    const s = crearSistema();
    s.montar(ctx);
    s.actualizar(0.016, ctx);
    const malla = escena.getObjectByName("Contact_Shadows") as THREE.InstancedMesh;
    expect(malla.count).toBe(3);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    malla.getMatrixAt(0, m);
    p.setFromMatrixPosition(m);
    expect([p.x, p.z]).toEqual([2, 1]);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeGreaterThan(0.05); // sobre la losa de los caminos
    expect(p.y).toBeLessThan(0.13);
    s.dispose();
    expect(escena.getObjectByName("Contact_Shadows")).toBeUndefined();
  });

  it("sigue al personaje cuando se mueve y no dibuja a los ocultos", () => {
    const escena = escenaConPersonajes();
    const ctx = { escena } as unknown as ContextoSistema;
    const s = crearSistema();
    s.montar(ctx);
    s.actualizar(0.016, ctx);
    escena.getObjectByName("personaje-nino")!.position.x = 7;
    escena.getObjectByName("iris")!.visible = false;
    s.actualizar(0.016, ctx);
    const malla = escena.getObjectByName("Contact_Shadows") as THREE.InstancedMesh;
    expect(malla.count).toBe(2);
    const m = new THREE.Matrix4();
    malla.getMatrixAt(0, m);
    expect(new THREE.Vector3().setFromMatrixPosition(m).x).toBe(7);
    s.dispose();
  });
});
