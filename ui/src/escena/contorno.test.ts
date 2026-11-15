import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { crearContorno } from "./contorno";
import { crearGuantes } from "./guantes";
import { crearMateriales } from "./materiales";
import { contarRender } from "./activos/terreno";

describe("contorno y guantes", () => {
  const m = crearMateriales();
  it("el contorno solo se ve junto a una consola y cuesta una llamada de dibujo", () => {
    const c = crearContorno(m);
    c.colocar(null);
    expect(c.malla.visible).toBe(false);
    c.colocar("habitat"); // sin consola
    expect(c.malla.visible).toBe(false);
    c.colocar("mesa");
    expect(c.malla.visible).toBe(true);
    const escena = new THREE.Scene();
    escena.add(c.malla);
    const r = contarRender(escena);
    expect(r.drawCalls).toBe(1);
    expect(r.triangulos).toBeLessThan(1500);
  });
  it("los guantes son una malla, ocultos hasta la primera persona", () => {
    const g = crearGuantes(m);
    expect(g.raiz.visible).toBe(false);
    g.mostrar(true);
    expect(g.raiz.visible).toBe(true);
    const escena = new THREE.Scene();
    escena.add(g.raiz);
    const r = contarRender(escena);
    expect(r.drawCalls).toBe(1);
    expect(r.triangulos).toBeLessThan(1500);
  });
});
