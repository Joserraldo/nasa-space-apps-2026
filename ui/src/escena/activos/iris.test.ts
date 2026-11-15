import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "../liberar";
import { caraIris, crearIris, dibujarCara, type ContextoCara, type LienzoCara } from "./iris";

/** Contexto de prueba: ignora los dibujos y avisa cada vez que se borra la pantalla entera. */
function contextoDePrueba(alBorrar: () => void = () => {}): ContextoCara {
  return new Proxy({} as Record<string, unknown>, {
    get: (o, k) => (k in o ? o[k as string] : k === "fillRect" ? (x: number, y: number) => { if (x === 0 && y === 0) alBorrar(); } : () => {}),
    set: (o, k, v) => ((o[k as string] = v), true),
  }) as unknown as ContextoCara;
}

function contar(raiz: THREE.Object3D) {
  let mallas = 0, triangulos = 0;
  raiz.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      mallas++;
      triangulos += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
    }
  });
  return { mallas, triangulos };
}

describe("Iris rover", () => {
  it("los cuatro niveles de NIVELES §5 se ven distintos y la avería manda", () => {
    expect(caraIris({ nivel: "tutorial", averiada: false })).toBe("atenta");
    expect(caraIris({ nivel: "pistas", averiada: false })).toBe("tranquila");
    expect(caraIris({ nivel: "danada", averiada: false })).toBe("error");
    expect(caraIris({ nivel: "offline", averiada: false })).toBe("apagada");
    expect(caraIris({ nivel: "pistas", averiada: true })).toBe("error");
    expect(caraIris({ nivel: "offline", averiada: true })).toBe("apagada");
  });

  it("es liviano: 3 draw calls y menos de 700 triángulos, con 4 ruedas en su pivote", () => {
    const m = crearMateriales();
    const iris = crearIris(m, { lienzo: () => null });
    const { mallas, triangulos } = contar(iris.raiz);
    expect(mallas).toBe(3);
    expect(triangulos).toBeLessThan(700);
    expect(iris.pivotes.ruedas).toHaveLength(4);
    expect(iris.raiz.getObjectByName("Rig")?.getObjectByName("Cuerpo")?.getObjectByName("Antena")).toBeInstanceOf(THREE.Bone);
    iris.liberar();
    liberarMateriales(Object.values(m));
    liberarCache();
  });

  it("las ruedas ruedan con la velocidad y la postura queda fija con movimiento reducido", () => {
    const m = crearMateriales();
    const iris = crearIris(m, { lienzo: () => null });
    iris.animar(0.5, { velocidad: 1, movimientoReducido: true });
    const giro = iris.pivotes.ruedas[0]!.rotation.x;
    expect(giro).toBeGreaterThan(0);
    for (const r of iris.pivotes.ruedas) expect(r.rotation.x).toBeCloseTo(giro);
    iris.fijarGesto("senalar");
    iris.animar(0.3, { velocidad: 0, movimientoReducido: true });
    const pose = [iris.pivotes.cuerpo.rotation.x, iris.pivotes.antena.rotation.x, iris.pivotes.cuerpo.position.y];
    iris.animar(1.7, { velocidad: 0, movimientoReducido: true });
    expect([iris.pivotes.cuerpo.rotation.x, iris.pivotes.antena.rotation.x, iris.pivotes.cuerpo.position.y]).toEqual(pose);
    expect(iris.pivotes.antena.rotation.x).toBeGreaterThan(0.5);
    iris.liberar();
    liberarMateriales(Object.values(m));
    liberarCache();
  });

  it("dañada pide reparación y pone el faro en alerta; offline lo apaga", () => {
    const m = crearMateriales();
    const iris = crearIris(m, { lienzo: () => null });
    const faro = iris.raiz.getObjectByName("IrisFaro") as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    const cian = faro.material.color.getHex();
    iris.fijarEstado({ nivel: "danada", averiada: false });
    iris.animar(0.1, { velocidad: 0, movimientoReducido: true });
    expect(iris.cara()).toBe("error");
    expect(faro.material.color.getHex()).not.toBe(cian);
    expect(iris.pivotes.antena.rotation.z).toBeLessThan(-0.3);
    expect(m.Emissive.color.getHex()).toBe(cian); // el material compartido no se toca
    iris.fijarEstado({ nivel: "offline", averiada: false });
    expect(faro.visible).toBe(false);
    iris.liberar();
    liberarMateriales(Object.values(m));
    liberarCache();
  });

  it("la cara se redibuja solo cuando cambia", () => {
    let dibujos = 0;
    const ctx = contextoDePrueba(() => dibujos++);
    const contado: LienzoCara = { width: 0, height: 0, getContext: () => ctx };
    const m = crearMateriales();
    const iris = crearIris(m, { lienzo: () => contado });
    expect(dibujos).toBe(1);
    for (let i = 0; i < 30; i++) iris.animar(0.016, { velocidad: 0, movimientoReducido: true });
    expect(dibujos).toBe(1);
    iris.fijarEstado({ nivel: "tutorial", averiada: false });
    expect(dibujos).toBe(2);
    const pantalla = iris.raiz.getObjectByName("IrisPantalla") as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    expect(pantalla.material.map).toBeInstanceOf(THREE.CanvasTexture);
    iris.liberar();
    liberarMateriales(Object.values(m));
    liberarCache();
  });

  it("la cara usa solo tokens: cian normal, error dañada, nada encendido apagada", () => {
    const colores = (cara: Parameters<typeof dibujarCara>[1]) => {
      const usados = new Set<string>();
      const ctx = new Proxy({} as Record<string, unknown>, {
        get: (o, k) => (k in o ? o[k as string] : () => {}),
        set: (o, k, v) => ((o[k as string] = v), (k === "strokeStyle" || k === "fillStyle") && usados.add(String(v)), true),
      }) as unknown as ContextoCara;
      dibujarCara(ctx, cara, false, 3);
      return usados;
    };
    expect(colores("atenta").has("#73D4E1")).toBe(true);
    expect(colores("tranquila").has("#73D4E1")).toBe(true);
    expect(colores("error").has("#B33A3A")).toBe(true);
    expect([...colores("apagada")]).toEqual(["#1C1248"]);
  });

  it("liberarEscena no toca los materiales compartidos", () => {
    const m = crearMateriales();
    const iris = crearIris(m, { lienzo: () => null });
    const r = liberarEscena(iris.raiz);
    expect(r.materiales).toBe(3); // facetado, pantalla y faro: propios de esta instancia
    iris.liberar();
    liberarMateriales(Object.values(m));
    liberarCache();
  });
});
