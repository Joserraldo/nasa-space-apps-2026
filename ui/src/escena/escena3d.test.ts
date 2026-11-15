/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import type { Equipment } from "@solar-shield/contracts";
import {
  CAMINOS, CLARO, DEM_JEZERO, MALLA_JEZERO, ROCAS, ROCAS_GRANDES, armarEscena, posicionesBalizas, rejillaJezero, rocaGrandeLibre,
} from "./armado";
import { cacheGeometrias, crearMateriales } from "./materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "./liberar";
import { LUGARES, TERRENO } from "./mundo";
import type { EstadoModulo, VistaEscena } from "./vista";
import { MODULOS_BASE } from "./activos/modulos";
import { PRESUPUESTO, aplanarClaro, alturaEnMundo, contarRender } from "./activos/terreno";

const dir = (f: string) => fileURLToPath(new URL(`../../../data/terreno/jezero/${f}`, import.meta.url));
const { dem } = JSON.parse(readFileSync(dir("jezero.json"), "utf-8")) as {
  dem: { archivo: string; ancho: number; alto: number; metrosPorPixel: number };
};
const archivo = readFileSync(dir(dem.archivo));
const rejilla = rejillaJezero(archivo.buffer.slice(archivo.byteOffset, archivo.byteOffset + archivo.byteLength) as ArrayBuffer);

function vista(modulos: Partial<Record<Equipment, EstadoModulo>>): VistaEscena {
  return {
    fase: "base",
    modulos: {
      panel_solar: "ausente",
      bateria: "ausente",
      reciclador_agua: "ausente",
      escudo: "ausente",
      invernadero: "ausente",
      antena: "ausente",
      ia_base: "funcionando",
      ...modulos,
    },
    iris: { nivel: "pistas", averiada: false },
    tormenta: { anunciada: false, activa: false },
    lugarObjetivo: null,
    resultado: "en_curso",
  };
}

const EJEMPLO = vista({ panel_solar: "funcionando", antena: "instalando" });

afterEach(() => {
  liberarCache();
});

describe("datos del terreno de la escena", () => {
  it("las dimensiones del DEM coinciden con jezero.json", () => {
    expect(DEM_JEZERO).toEqual({ ancho: dem.ancho, alto: dem.alto, metrosPorPixel: dem.metrosPorPixel });
  });

  it("el claro queda llano en y = 0 bajo la base y el relieve sigue alrededor", () => {
    const claro = aplanarClaro(rejilla, MALLA_JEZERO, CLARO.radio, CLARO.borde);
    const y = (x: number, z: number) => alturaEnMundo(claro.rejilla, MALLA_JEZERO, x, z) - claro.altura;
    for (const l of LUGARES) expect(Math.abs(y(l.mx, l.mz)), l.id).toBeLessThan(1e-3);
    for (const [x, z] of [...posicionesBalizas(), ...CAMINOS.flat()]) expect(Math.abs(y(x, z))).toBeLessThan(1e-3);
    let relieve = 0;
    for (let a = 0; a < 16; a++) relieve = Math.max(relieve, Math.abs(y(Math.cos(a) * 120, Math.sin(a) * 120)));
    expect(relieve).toBeGreaterThan(1);
  });
});

describe("armarEscena", () => {
  it("la escena completa cabe en el presupuesto (≤ 80 draw calls, ≤ 80 000 triángulos)", () => {
    const m = crearMateriales();
    const a = armarEscena(m, EJEMPLO, rejilla);
    const c = contarRender(a.escena);
    console.info(`escena completa (2 módulos): ${c.drawCalls} draw calls, ${c.triangulos} triángulos`);
    expect(c.drawCalls).toBeLessThanOrEqual(PRESUPUESTO.drawCalls);
    expect(c.triangulos).toBeLessThanOrEqual(PRESUPUESTO.triangulos);
    a.liberar();
  });

  it("aun con los cinco módulos funcionando cabe en el presupuesto", () => {
    const a = armarEscena(crearMateriales(), vista(Object.fromEntries(MODULOS_BASE.map((id) => [id, "funcionando"]))), rejilla);
    const c = contarRender(a.escena);
    console.info(`escena completa (5 módulos): ${c.drawCalls} draw calls, ${c.triangulos} triángulos`);
    for (const id of MODULOS_BASE) expect(a.modulos[id].solido.visible, id).toBe(true);
    for (const nombre of ["Base_Buildings", "Kit_Paths", "Mountains_Far", "Rocks_Basalt_Large"]) expect(a.escena.getObjectByName(nombre), nombre).toBeDefined();
    expect(c.drawCalls).toBeLessThanOrEqual(PRESUPUESTO.drawCalls);
    expect(c.triangulos).toBeLessThanOrEqual(PRESUPUESTO.triangulos);
    a.liberar();
  });

  it("los anclajes siempre existen y solo los construidos se ven construidos", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    expect(a.escena.getObjectByName("Module_Anchor_Instanced")).toBeDefined();
    expect(a.modulos.panel_solar.solido.visible).toBe(true);
    expect(a.modulos.panel_solar.vivos.visible).toBe(true);
    expect(a.modulos.antena.solido.visible).toBe(false);
    expect(a.modulos.antena.andamio.visible).toBe(true);
    for (const id of ["escudo", "invernadero", "reciclador_agua"] as const) {
      expect(a.modulos[id].solido.visible || a.modulos[id].andamio.visible, id).toBe(false);
    }
    a.aplicarVista(vista({ panel_solar: "averiado" }));
    expect(a.modulos.panel_solar.solido.visible).toBe(true);
    expect(a.modulos.panel_solar.vivos.visible).toBe(false);
    a.liberar();
  });

  it("las rocas quedan fuera del claro y las balizas van instanciadas", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    const rocas = a.escena.getObjectByName("Rocks_Basalt") as THREE.InstancedMesh;
    expect(rocas.count).toBe(ROCAS.n);
    const mt = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (let i = 0; i < rocas.count; i++) {
      rocas.getMatrixAt(i, mt);
      p.setFromMatrixPosition(mt);
      expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(ROCAS.radioMin - 1e-6);
    }
    const balizas: THREE.InstancedMesh[] = [];
    a.escena.getObjectByName("Kit_Beacon_Instanced")!.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) balizas.push(o);
    });
    expect(balizas.length).toBeGreaterThan(0);
    for (const b of balizas) expect(b.count).toBe(posicionesBalizas().length);
    a.liberar();
  });

  it("hay rocas grandes en el borde del claro, instanciadas y lejos de los edificios", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    const grandes = a.escena.getObjectByName("Rocks_Basalt_Large") as THREE.InstancedMesh;
    expect(grandes).toBeInstanceOf(THREE.InstancedMesh);
    expect(grandes.count).toBeGreaterThanOrEqual(6);
    expect(grandes.count).toBeLessThanOrEqual(ROCAS_GRANDES.n);
    const mt = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (let i = 0; i < grandes.count; i++) {
      grandes.getMatrixAt(i, mt);
      p.setFromMatrixPosition(mt);
      expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(ROCAS_GRANDES.radioMin - 1e-6);
      expect(rocaGrandeLibre(p.x, p.z)).toBe(true);
    }
    a.liberar();
  });

  it("los caminos unen los lugares de los circuitos A y B y las balizas no caen sobre módulos", () => {
    const extremos = CAMINOS.flat();
    for (const id of ["taller", "panel_solar", "escudo", "habitat", "sensor", "reciclador_agua", "invernadero", "antena", "banco"] as const) {
      const l = LUGARES.find((x) => x.id === id)!;
      expect(extremos.some(([x, z]) => Math.hypot(x - l.x, z - l.z) < 0.6), id).toBe(true);
    }
    const balizas = posicionesBalizas();
    expect(balizas.length).toBeGreaterThanOrEqual(4);
    expect(balizas.length).toBeLessThanOrEqual(12);
    for (const [x, z] of balizas) for (const c of TERRENO.circulos) expect(Math.hypot(x - c.x, z - c.z)).toBeGreaterThan(c.r);
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    const caminos = a.escena.getObjectByName("Kit_Paths") as THREE.Mesh;
    expect(caminos.geometry.getAttribute("color")).toBeDefined();
    expect(caminos.castShadow).toBe(false);
    a.liberar();
  });

  it("la cordillera lejana es una sola malla lila, sin sombra y sin azul dominante", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, null);
    const m = a.escena.getObjectByName("Mountains_Far") as THREE.Mesh;
    expect(m).toBeInstanceOf(THREE.Mesh);
    expect(m.castShadow).toBe(false);
    const col = m.geometry.getAttribute("color");
    const pos = m.geometry.getAttribute("position");
    let r = 0, b = 0, haciaDentro = 0, caras = 0;
    for (let i = 0; i < col.count; i++) { r += col.getX(i); b += col.getZ(i); }
    expect(r / b).toBeGreaterThan(0.45); // lila (rojo y azul juntos), no un azul puro
    const n = m.geometry.getAttribute("normal");
    for (let i = 0; i < pos.count; i += 3) {
      if (Math.abs(n.getY(i)) > 0.95) continue;
      caras++;
      if (n.getX(i) * pos.getX(i) + n.getZ(i) * pos.getZ(i) < 0) haciaDentro++;
    }
    expect(haciaDentro / caras).toBeGreaterThan(0.6); // las caras miran a la base
    expect(contarRender(m).triangulos).toBeLessThan(1000);
    a.liberar();
  });

  it("con movimiento reducido las animaciones quedan en su estado final", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    a.pulsar("panel_solar", 1000);
    a.animar(1100, true);
    expect(a.modulos.panel_solar.raiz.scale.x).toBe(1);
    expect(a.modulos.panel_solar.vivos.scale.x).toBe(1);
    expect(a.modulos.antena.andamio.scale.y).toBe(1);
    a.liberar();
  });
});

describe("liberación", () => {
  it("no quedan geometrías, materiales ni texturas sin liberar", () => {
    const m = crearMateriales();
    const a = armarEscena(m, EJEMPLO, rejilla);
    a.ponerTerreno(rejilla); // reemplazar el terreno libera el anterior
    const pendientes = new Set<{ dispose(): void }>();
    const liberaciones = new Map<object, number>();
    const vigilar = (r: THREE.EventDispatcher<{ dispose: object }> & { dispose(): void }) => {
      if (pendientes.has(r)) return;
      pendientes.add(r);
      liberaciones.set(r, 0);
      r.addEventListener("dispose", () => {
        pendientes.delete(r);
        liberaciones.set(r, liberaciones.get(r)! + 1);
      });
    };
    a.escena.traverse((o) => {
      const x = o as Partial<THREE.Mesh>;
      if (x.geometry) vigilar(x.geometry);
      const mats = Array.isArray(x.material) ? x.material : x.material ? [x.material] : [];
      for (const mat of mats) vigilar(mat);
    });
    for (const mat of Object.values(m)) vigilar(mat);
    for (const g of cacheGeometrias().values()) vigilar(g);
    expect(pendientes.size).toBeGreaterThan(20);

    // Mismo orden que `Escena3D.dispose()`.
    a.liberar();
    liberarEscena(a.escena, { compartidos: true });
    liberarMateriales(Object.values(m));
    liberarCache();
    expect(pendientes.size).toBe(0);
    for (const veces of liberaciones.values()) expect(veces).toBe(1);
    expect(a.escena.children.filter((o) => o.name === "Sky_Dome")).toHaveLength(0);
  });
});
