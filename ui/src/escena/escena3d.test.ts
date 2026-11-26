/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import type { Equipment } from "@solar-shield/contracts";
import {
  CAMINOS, CLARO, DEM_JEZERO, MALLA_JEZERO, ROCAS_GRANDES, armarEscena, posicionesBalizas, rejillaJezero, rocaGrandeLibre,
  ROCAS_PRIMER_PLANO, radioRocaPrimerPlano, rocaPrimerPlanoLibre, rocasGrandes,
} from "./armado";
import { GRUPOS_ROCAS } from "./activos/rocasMarte";
import { mascaraZona } from "./activos/relieve";
import { cacheGeometrias, crearMateriales } from "./materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "./liberar";
import { LUGARES, TERRENO } from "./mundo";
import type { EstadoModulo, VistaEscena } from "./vista";
import { MODULOS_BASE } from "./activos/modulos";
import { CAMARAS, fovParaAspecto } from "./escena3d";
import { CONSOLAS, decorado } from "./activos/baseExterior";
import { giroHacia } from "./activos/modulosArmados";
import { crearConsola } from "./activos/piezasComunes";
import { crearHabitat, crearTorreControl } from "./activos/edificios";
import { lugar } from "./mundo";
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
  it("la escena completa cabe en el presupuesto de draw calls y triángulos", () => {
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
    for (const nombre of ["Base_Buildings", "Kit_Paths", "Terrain_Jezero", "Rocks_Near", "Rocks_Clusters_Far"]) expect(a.escena.getObjectByName(nombre), nombre).toBeDefined();
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

  it("las rocas de los grupos quedan fuera del círculo caminable, ninguna es de 12 caras y las balizas van instanciadas", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    const posiciones = (nombre: string) => {
      const salida: THREE.Vector3[] = [];
      const mt = new THREE.Matrix4();
      a.escena.getObjectByName(nombre)!.traverse((o) => {
        if (!(o instanceof THREE.InstancedMesh)) return;
        expect(contarRender(o).triangulos / o.count / (o.castShadow ? 2 : 1), o.name).toBeGreaterThanOrEqual(80);
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, mt);
          salida.push(new THREE.Vector3().setFromMatrixPosition(mt));
        }
      });
      return salida;
    };
    const grandes = rocasGrandes(aplanarClaro(rejilla, MALLA_JEZERO, CLARO.radio, CLARO.borde).rejilla);
    const cerca = posiciones("Rocks_Near");
    const lejos = posiciones("Rocks_Clusters_Far");
    const conColision = [...grandes, ...ROCAS_PRIMER_PLANO];
    const enGrandesYPrimerPlano = (p: THREE.Vector3) => conColision.some((g) => Math.hypot(g.posicion[0] - p.x, g.posicion[2] - p.z) < 1e-3);
    // Los grupos solo existen dentro de la zona de la Etapa BC (un sector de ±60°).
    expect(cerca.length).toBeGreaterThan(grandes.length + 10);
    expect(lejos.length).toBeGreaterThan(15);
    for (const p of [...cerca.filter((q) => !enGrandesYPrimerPlano(q)), ...lejos]) expect(mascaraZona(p.x, p.z)).toBeGreaterThanOrEqual(0.6 - 1e-6);
    // Las del borde del claro y las de primer plano tienen colisión; el resto son de grupos y no se pueden pisar.
    for (const p of [...cerca.filter((q) => !enGrandesYPrimerPlano(q)), ...lejos]) expect(Math.hypot(p.x, p.z)).toBeGreaterThan(GRUPOS_ROCAS.limiteCaminable - 1);
    const balizas: THREE.InstancedMesh[] = [];
    a.escena.getObjectByName("Kit_Beacon_Instanced")!.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) balizas.push(o);
    });
    expect(balizas.length).toBeGreaterThan(0);
    for (const b of balizas) expect(b.count).toBe(posicionesBalizas().length);
    a.liberar();
  });

  it("hay rocas grandes en el borde del claro, lejos de los edificios", () => {
    const grandes = rocasGrandes(aplanarClaro(rejilla, MALLA_JEZERO, CLARO.radio, CLARO.borde).rejilla);
    expect(grandes.length).toBeGreaterThanOrEqual(6);
    expect(grandes.length).toBeLessThanOrEqual(ROCAS_GRANDES.n);
    for (const { posicion: [x, , z] } of grandes) {
      expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(ROCAS_GRANDES.radioMin - 1e-6);
      expect(rocaGrandeLibre(x, z)).toBe(true);
    }
  });

  it("las rocas de primer plano (mundo/01) van instanciadas y no tapan caminos, lugares ni sólidos", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    const mt = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const puestas: THREE.Vector3[] = [];
    a.escena.getObjectByName("Rocks_Near")!.traverse((o) => {
      if (!(o instanceof THREE.InstancedMesh)) return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, mt);
        puestas.push(p.setFromMatrixPosition(mt).clone());
      }
    });
    // El grupo del terreno solo se desplaza en y: la planta de cada roca de primer plano no cambia.
    for (const r of ROCAS_PRIMER_PLANO) expect(puestas.some((q) => Math.hypot(q.x - r.posicion[0], q.z - r.posicion[2]) < 1e-3)).toBe(true);
    for (const r of ROCAS_PRIMER_PLANO) {
      const [x, , z] = r.posicion;
      expect(rocaPrimerPlanoLibre(x, z, radioRocaPrimerPlano(r)), `${x},${z}`).toBe(true);
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
    let r = 0, b = 0, haciaDentro = 0, caras = 0, enZona = 0;
    for (let i = 0; i < col.count; i++) { r += col.getX(i); b += col.getZ(i); }
    expect(r / b).toBeGreaterThan(0.45); // lila (rojo y azul juntos), no un azul puro
    const n = m.geometry.getAttribute("normal");
    for (let i = 0; i < pos.count; i += 3) {
      // Fuera de la zona de la Etapa BC: ahí el horizonte es la capa lejana del terreno.
      if (mascaraZona(pos.getX(i + 2), pos.getZ(i + 2)) >= 1) enZona++;
      if (Math.abs(n.getY(i)) > 0.95) continue;
      caras++;
      if (n.getX(i) * pos.getX(i) + n.getZ(i) * pos.getZ(i) < 0) haciaDentro++;
    }
    expect(enZona).toBe(0);
    expect(haciaDentro / caras).toBeGreaterThan(0.6); // las caras miran a la base
    expect(contarRender(m).triangulos).toBeLessThan(1000);
    a.liberar();
  });

  it("en la zona el terreno cierra el horizonte en capas: más alto lejos, una sola malla sin sombra propia", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    const m = a.escena.getObjectByName("Terrain_Jezero") as THREE.Mesh;
    expect(m).toBeInstanceOf(THREE.Mesh);
    expect(m.castShadow).toBe(false);
    const pos = m.geometry.getAttribute("position");
    const media = (r0: number, r1: number) => {
      let s = 0, n = 0;
      for (let i = 0; i < pos.count; i++) {
        const r = Math.hypot(pos.getX(i), pos.getZ(i));
        if (r >= r0 && r < r1 && mascaraZona(pos.getX(i), pos.getZ(i)) >= 1) { s += pos.getY(i); n++; }
      }
      return s / n;
    };
    const claro = media(0, 30), medio = media(140, 200), lejos = media(320, 520);
    expect(medio - claro).toBeGreaterThan(5);
    expect(lejos - medio).toBeGreaterThan(5);
    a.liberar();
  });

  it("con suelo detallado los caminos van en el suelo; en calidad baja vuelven las losas", () => {
    const a = armarEscena(crearMateriales(), EJEMPLO, rejilla);
    const losas = a.escena.getObjectByName("Kit_Paths")!;
    const terreno = a.escena.getObjectByName("Terrain_Jezero") as THREE.Mesh;
    a.usarSueloDetallado(true);
    expect(losas.visible).toBe(false);
    expect(terreno.material).toBe(a.suelo.terreno.detallado);
    a.usarSueloDetallado(false);
    expect(losas.visible).toBe(true);
    expect(terreno.material).toBe(a.suelo.terreno.simple);
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

describe("encuadre de tercera persona (mundo/01)", () => {
  /** Rectángulo en pantalla (NDC) de los vértices de un objeto vistos desde `CAMARAS.tercera` a 1024×683. */
  function enPantalla(o: THREE.Object3D, ancho = 1024, alto = 683) {
    const camara = new THREE.PerspectiveCamera(fovParaAspecto("tercera", ancho / alto), ancho / alto, 0.1, 600);
    camara.position.set(...CAMARAS.tercera.pos);
    camara.lookAt(new THREE.Vector3(...CAMARAS.tercera.mira));
    camara.updateMatrixWorld(true);
    o.updateMatrixWorld(true);
    const xs: number[] = [], ys: number[] = [];
    const p = new THREE.Vector3();
    o.traverse((malla) => {
      if (!(malla instanceof THREE.Mesh)) return;
      const pos = malla.geometry.getAttribute("position");
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(malla.matrixWorld).project(camara);
        xs.push(p.x);
        ys.push(p.y);
      }
    });
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  it("la torre se ve entera, a la izquierda del hábitat y sin taparse con él", () => {
    const m = crearMateriales();
    const t = decorado("torre"), h = lugar("habitat");
    const torre = crearTorreControl(m);
    torre.position.set(t.x, 0, t.z);
    torre.rotation.y = Math.atan2(-t.x, -t.z);
    const habitat = crearHabitat(m);
    habitat.position.set(h.mx, 0, h.mz);
    const pt = enPantalla(torre), ph = enPantalla(habitat);
    expect(pt.x1, "la torre invade el hábitat en pantalla").toBeLessThan(ph.x0);
    expect(pt.x0).toBeGreaterThan(-1);
    expect(pt.y1).toBeLessThan(1);
    liberarEscena(torre);
    liberarEscena(habitat);
  });

  const punto = (x: number, y: number, z: number, ancho: number, alto: number) => {
    const camara = new THREE.PerspectiveCamera(fovParaAspecto("tercera", ancho / alto), ancho / alto, 0.1, 600);
    camara.position.set(...CAMARAS.tercera.pos);
    camara.lookAt(new THREE.Vector3(...CAMARAS.tercera.mira));
    camara.updateMatrixWorld(true);
    return new THREE.Vector3(x, y, z).project(camara);
  };

  it("ninguna roca de primer plano tapa la vista: bajas y debajo del horizonte (occupy-mars-2; 1024x683)", () => {
    for (const r of ROCAS_PRIMER_PLANO) {
      expect(r.escala[1], `${r.posicion}`).toBeLessThan(0.8);
      // La cima queda en la mitad inferior del cuadro: no corta el horizonte.
      const cima = punto(r.posicion[0], r.escala[1] * 1.2, r.posicion[2], 1024, 683);
      if (Math.abs(cima.x) < 1 && cima.z < 1) expect(cima.y).toBeLessThan(0);
    }
    expect(ROCAS_PRIMER_PLANO.length).toBeLessThanOrEqual(4);
  });

  it("la consola queda en la mitad inferior y el horizonte en el tercio superior (1024x683)", () => {
    const m = lugar("mesa");
    expect(punto(m.mx, 1, m.mz, 1024, 683).y).toBeLessThan(0);
    expect(punto(0, 0, -500, 1024, 683).y).toBeGreaterThan(1 / 3);
  });

  /** Cámara de tercera persona a `ancho`×`alto`, con el FOV que le corresponde a ese aspecto. */
  function camaraTercera(ancho: number, alto: number): THREE.PerspectiveCamera {
    const camara = new THREE.PerspectiveCamera(fovParaAspecto("tercera", ancho / alto), ancho / alto, 0.1, 600);
    colocarCamaraTercera(camara);
    return camara;
  }

  function colocarCamaraTercera(camara: THREE.PerspectiveCamera) {
    camara.position.set(...CAMARAS.tercera.pos);
    camara.lookAt(new THREE.Vector3(...CAMARAS.tercera.mira));
    camara.updateMatrixWorld(true);
  }

  /** Esquinas (NDC) del `Box3` del objeto que quedan fuera del cuadro, con un margen de 0,02. */
  function esquinasFuera(o: THREE.Object3D, camara: THREE.Camera): { x: number; y: number }[] {
    o.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(o);
    const fuera: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camara);
      if (Math.abs(p.x) > 1 - 0.02 || Math.abs(p.y) > 1 - 0.02) fuera.push({ x: p.x, y: p.y });
    }
    return fuera;
  }

  /** Hábitat colocado como en `armarEdificios`. */
  function habitatEnEscena(): THREE.Group {
    const h = lugar("habitat");
    const g = crearHabitat(crearMateriales());
    g.position.set(h.mx, 0, h.mz);
    return g;
  }

  /** Consola de la mesa colocada como en `armarEdificios` (misma escala y giro). */
  function consolaMesa(): THREE.Group {
    const l = lugar("mesa");
    const k = CONSOLAS.find((c) => c.lugar === "mesa")!;
    const g = crearConsola(crearMateriales());
    g.position.set(l.mx, 0, l.mz);
    g.rotation.y = giroHacia(l, l);
    g.scale.setScalar(k.escala);
    return g;
  }

  it.each([[844, 390], [390, 844]])("el hábitat y la consola caben enteros en el cuadro a %ix%i (8 esquinas de cada caja)", (w, h) => {
    const camara = camaraTercera(w, h);
    const habitat = habitatEnEscena(), consola = consolaMesa();
    expect(esquinasFuera(habitat, camara), "hábitat").toEqual([]);
    expect(esquinasFuera(consola, camara), "consola").toEqual([]);
    liberarEscena(habitat);
    liberarEscena(consola);
  });

  it("al redimensionar de 1024x683 a 390x844 el FOV cambia y la consola sigue entera en el cuadro", () => {
    const camara = camaraTercera(1024, 683);
    const fovAntes = camara.fov;
    camara.aspect = 390 / 844;
    camara.fov = fovParaAspecto("tercera", camara.aspect);
    camara.updateProjectionMatrix();
    expect(camara.fov).toBeGreaterThan(fovAntes);
    expect(camara.fov).toBeCloseTo(fovParaAspecto("tercera", 390 / 844));
    const consola = consolaMesa();
    expect(esquinasFuera(consola, camara), "consola").toEqual([]);
    liberarEscena(consola);
  });

  it("el campo visual se abre solo en cuadros más altos que anchos y tiene tope", () => {
    expect(fovParaAspecto("tercera", 1.5)).toBeCloseTo(60);
    expect(fovParaAspecto("tercera", 2.2)).toBeCloseTo(60);
    expect(fovParaAspecto("tercera", 0.8)).toBeGreaterThan(60);
    expect(fovParaAspecto("tercera", 0.2)).toBe(90);
    expect(fovParaAspecto("primera", 0.5)).toBe(70);
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
