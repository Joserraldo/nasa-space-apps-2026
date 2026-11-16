import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { AJUSTE_CALIDAD } from "../calidad";
import { aplicarFiltro, tipoSombra } from "./filtroSombra";

function ctxFalso(calidad: "alta" | "media" | "baja", tipo: THREE.ShadowMapType = THREE.PCFSoftShadowMap) {
  const escena = new THREE.Scene();
  const material = new THREE.MeshStandardMaterial();
  escena.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  const renderer = { shadowMap: { type: tipo, needsUpdate: false } } as unknown as THREE.WebGLRenderer;
  return { escena, renderer, calidad, material };
}

describe("filtro de sombra por calidad (D4)", () => {
  it("alta suave, media simple y baja sin tocar (no tiene sombras)", () => {
    expect(tipoSombra("alta")).toBe(THREE.PCFSoftShadowMap);
    expect(tipoSombra("media")).toBe(THREE.BasicShadowMap);
    expect(tipoSombra("baja")).toBeNull();
    expect(AJUSTE_CALIDAD.baja.sombra).toBeNull();
  });

  it("media sigue teniendo sombra del Sol y cuesta menos por píxel que alta", () => {
    expect(AJUSTE_CALIDAD.media.sombra).not.toBeNull();
    expect(AJUSTE_CALIDAD.media.dpr).toBeLessThan(AJUSTE_CALIDAD.alta.dpr);
    expect(AJUSTE_CALIDAD.media.antialias).toBe(false);
  });

  it("al cambiar el filtro marca los materiales para recompilar, y solo una vez", () => {
    const c = ctxFalso("media");
    const v = c.material.version;
    expect(aplicarFiltro(c)).toBe(true);
    expect(c.renderer.shadowMap.type).toBe(THREE.BasicShadowMap);
    expect(c.material.version).toBe(v + 1);
    expect(aplicarFiltro(c)).toBe(false);
    expect(c.material.version).toBe(v + 1);
  });

  it("en baja no cambia el filtro ni recompila", () => {
    const c = ctxFalso("baja");
    const v = c.material.version;
    expect(aplicarFiltro(c)).toBe(false);
    expect(c.renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
    expect(c.material.version).toBe(v);
  });
});
