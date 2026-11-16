import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { ContextoSistema } from "../escena3d";
import { TERRENO } from "../mundo";
import { REMOLINOS, crearSistema, hayRemolinos, poseRemolino } from "./remolinos";

const posicion = (m: THREE.Matrix4) => new THREE.Vector3().setFromMatrixPosition(m);

describe("remolinos de polvo a lo lejos (D6)", () => {
  it("están lejos de la base, bien afuera de donde se camina", () => {
    for (let i = 0; i < REMOLINOS.length; i++) {
      for (const t of [0, 60, 600]) {
        const p = posicion(poseRemolino(i, t, false));
        expect(Math.hypot(p.x, p.z)).toBeGreaterThan(TERRENO.limite * 3);
        expect(p.y).toBe(0);
      }
    }
  });

  it("se ven de día y de tarde, no en el atardecer del final", () => {
    expect(hayRemolinos("base")).toBe(true);
    expect(hayRemolinos("tormenta")).toBe(true);
    expect(hayRemolinos("final")).toBe(false);
  });

  it("con movimiento reducido quedan quietos", () => {
    for (let i = 0; i < REMOLINOS.length; i++) expect(poseRemolino(i, 0, true).equals(poseRemolino(i, 30, true))).toBe(true);
    expect(poseRemolino(0, 0, false).equals(poseRemolino(0, 30, false))).toBe(false);
  });

  it("todos en una sola malla (1 draw call), ocultos en el final y liberados al quitarse", () => {
    const escena = new THREE.Scene();
    const ctx = { escena, reducido: false, vista: { fase: "base" } } as unknown as ContextoSistema;
    const s = crearSistema();
    s.montar(ctx);
    s.actualizar(0.016, ctx);
    const malla = escena.getObjectByName("Dust_Devils") as THREE.InstancedMesh;
    expect(malla).toBeInstanceOf(THREE.InstancedMesh);
    expect(malla.count).toBe(REMOLINOS.length);
    expect(malla.visible).toBe(true);
    s.actualizar(0.016, { ...ctx, vista: { fase: "final" } } as unknown as ContextoSistema);
    expect(malla.visible).toBe(false);
    s.dispose();
    expect(escena.getObjectByName("Dust_Devils")).toBeUndefined();
  });
});
