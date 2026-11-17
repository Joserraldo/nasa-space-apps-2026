import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { liberarCache, liberarEscena } from "./liberar";
import { cacheGeometrias, crearMateriales, type Materiales } from "./materiales";
import { instanciar } from "./activos/instancias";
import {
  crearAntena, crearBaliza, crearCaja, crearCamino, crearConsola, crearDeposito, crearPanelSolar, crearPuerta,
} from "./activos/piezasComunes";
import { PRESUPUESTO, contarRender } from "./activos/terreno";

const PIEZAS: Record<string, (m: Materiales) => THREE.Group> = {
  puerta: crearPuerta, consola: crearConsola, caja: crearCaja, panelSolar: crearPanelSolar,
  deposito: crearDeposito, antena: crearAntena, baliza: crearBaliza, camino: crearCamino,
};

function meshes(g: THREE.Object3D): THREE.Mesh[] {
  const r: THREE.Mesh[] = [];
  g.traverse((o) => { if (o instanceof THREE.Mesh) r.push(o); });
  return r;
}
const tris = (g: THREE.Object3D) =>
  meshes(g).reduce((n, m) => n + (m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute("position").count) / 3, 0);

afterEach(() => liberarCache());

describe("kit de piezas comunes", () => {
  it.each(Object.keys(PIEZAS))("%s: menos de 300 triángulos y solo materiales del juego", (nombre) => {
    const mats = crearMateriales();
    const pieza = PIEZAS[nombre]!(mats);
    expect(tris(pieza)).toBeLessThan(300);
    expect(meshes(pieza).length).toBeGreaterThan(0);
    const juego = new Set<THREE.Material>(Object.values(mats));
    for (const m of meshes(pieza)) {
      expect(juego.has(m.material as THREE.Material)).toBe(true);
      const flatEsperado = m.material === mats.Rock || m.material === mats.Plant || m.material === mats.Hair || m.material === mats.Glass;
      expect((m.material as THREE.MeshStandardMaterial).flatShading).toBe(flatEsperado);
      expect(m.geometry.userData.compartido).toBe(true); // geometrías de la caché
    }
  });

  it("las partes emisivas usan el slot Emissive y el camino lleva color de vértice", () => {
    const mats = crearMateriales();
    const luz = meshes(crearBaliza(mats)).filter((m) => m.material === mats.Emissive);
    expect(luz).toHaveLength(1);
    for (const m of meshes(crearCamino(mats))) expect(m.geometry.getAttribute("color")).toBeDefined();
  });

  it("el cuenco de la antena abre hacia +z (cara interior visible)", () => {
    const dish = meshes(crearAntena(crearMateriales())).find((m) => m.name === "Antenna_Dish")!;
    const g = dish.geometry.index ? dish.geometry.toNonIndexed() : dish.geometry;
    g.computeVertexNormals();
    const n = g.getAttribute("normal");
    let z = 0;
    for (let i = 0; i < n.count; i++) z += n.getZ(i);
    expect(z).toBeGreaterThan(0);
  });

  it("20 balizas instanciadas hacen los mismos draw calls que 1 pieza", () => {
    const mats = crearMateriales();
    const una = new THREE.Group().add(crearBaliza(mats));
    const veinte = instanciar(() => crearBaliza(mats), Array.from({ length: 20 }, (_, i) => ({ posicion: [i * 2, 0, 0] as [number, number, number] })));
    expect(contarRender(veinte).drawCalls).toBe(contarRender(una).drawCalls);
    expect(contarRender(veinte).triangulos).toBe(20 * contarRender(una).triangulos);
    for (const im of veinte.children) {
      expect(im).toBeInstanceOf(THREE.InstancedMesh);
      expect((im as THREE.InstancedMesh).count).toBe(20);
    }
  });

  it("instanciar conserva la posición de cada parte y aplica la transformación", () => {
    const mats = crearMateriales();
    const g = instanciar(() => crearBaliza(mats), [{ posicion: [10, 0, 5], escala: 2 }]);
    const luz = g.children.find((c) => c.name === "Beacon_Light") as THREE.InstancedMesh;
    const m = new THREE.Matrix4();
    luz.getMatrixAt(0, m);
    const p = new THREE.Vector3().setFromMatrixPosition(m);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(1.48); // 0,74 × 2
    expect(p.z).toBeCloseTo(5);
  });

  it("liberarEscena no libera lo compartido (geometrías de la caché y materiales)", () => {
    const mats = crearMateriales();
    const escena = new THREE.Group().add(crearPuerta(mats), crearConsola(mats), instanciar(() => crearCaja(mats), [{}, { posicion: [3, 0, 0] }]));
    const geos = [...cacheGeometrias().values()];
    let disposed = 0;
    for (const g of geos) g.addEventListener("dispose", () => disposed++);
    for (const m of Object.values(mats)) m.addEventListener("dispose", () => disposed++);
    const r = liberarEscena(escena);
    expect(r.geometrias).toBe(0);
    expect(r.materiales).toBe(0);
    expect(disposed).toBe(0);
  });

  it("presupuesto: el kit entero cabe holgado con contarRender", () => {
    const mats = crearMateriales();
    const escena = new THREE.Group();
    for (const f of Object.values(PIEZAS)) escena.add(f(mats));
    const total = contarRender(escena);
    expect(total.drawCalls).toBeLessThan(PRESUPUESTO.drawCalls); // sin luces con sombra: 1 por malla
    expect(total.triangulos).toBeLessThan(PRESUPUESTO.triangulos);
    // Repetir 40 cajas y 40 tramos de camino no añade apenas draw calls.
    escena.add(
      instanciar(() => crearCaja(mats), Array.from({ length: 40 }, (_, i) => ({ posicion: [i, 0, 8] as [number, number, number] }))),
      instanciar(() => crearCamino(mats), Array.from({ length: 40 }, (_, i) => ({ posicion: [i, 0, 12] as [number, number, number] }))),
    );
    expect(contarRender(escena).drawCalls).toBeLessThan(PRESUPUESTO.drawCalls);
  });
});
