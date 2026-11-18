import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { beforeAll, describe, expect, it } from "vitest";
import { armarEscena } from "../armado";
import { crearMateriales } from "../materiales";
import { liberarEscena, liberarMateriales } from "../liberar";
import { LUGARES } from "../mundo";
import type { VistaEscena } from "../vista";
import { distanciaAHuella } from "./baseExterior";
import { sobreCamino } from "./caminos";
import { CORREDORES, CORREDOR_ELEVADO, fusionarConUV, huellasColonia } from "./colonia";
import { SITIO_PERSEVERANCE } from "./coloniaEscena";
import type { ModelosModulos } from "./modelosModulos";

/** Kit real (`public/modelos/kit-colonia.glb`, sin texturas: se carga en Node) y modelos CC BY de prueba. */
let kit: THREE.Group;
beforeAll(async () => {
  const buf = readFileSync(fileURLToPath(new URL("../../../public/modelos/kit-colonia.glb", import.meta.url)));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf = await new Promise<{ scene: THREE.Group }>((res, rej) => new GLTFLoader().parse(ab, "", res as never, rej));
  kit = gltf.scene;
});

function modelos(): ModelosModulos {
  const malla = (nombre: string, extra: THREE.Object3D[] = []) => {
    const g = new THREE.Group();
    g.name = nombre;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ name: nombre, map: new THREE.Texture() })), ...extra);
    return g;
  };
  const rotor = (n: string) => Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.1), new THREE.MeshStandardMaterial()), { name: n });
  return {
    antena: malla("antena"),
    kit,
    habitat: malla("habitat"),
    torre: malla("torre"),
    reciclador: malla("reciclador"),
    capsula: malla("capsula"),
    ingenuity: malla("ingenuity", [rotor("rotors_01"), rotor("rotors_02")]),
    tripulante: malla("tripulante"),
  };
}

function vista(sitio: string | null): VistaEscena {
  return {
    fase: "base",
    modulos: { panel_solar: "funcionando", antena: "funcionando", bateria: "ausente", reciclador_agua: "funcionando", escudo: "funcionando", invernadero: "funcionando", ia_base: "funcionando" },
    iris: { nivel: "pistas", averiada: false },
    tormenta: { anunciada: false, activa: false },
    sitio,
    lugarObjetivo: null,
    resultado: "en_curso",
  };
}

const triangulos = (o: THREE.Object3D) => {
  let n = 0;
  o.traverse((x) => {
    if (x instanceof THREE.Mesh) n += (x.geometry.index ? x.geometry.index.count : x.geometry.getAttribute("position").count) / 3;
  });
  return n;
};

describe("colonia de Jezero (Etapa D3)", () => {
  it("la fusión conserva UV y color, y completa en blanco el color que falta", () => {
    const g = new THREE.Group();
    const conColor = new THREE.BoxGeometry(1, 1, 1);
    conColor.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(conColor.getAttribute("position").count * 3).fill(0.5), 3));
    const mat = new THREE.MeshStandardMaterial({ name: "Colony_Kit", vertexColors: true });
    g.add(new THREE.Mesh(conColor, mat), new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat));
    const f = fusionarConUV(g, "Prueba");
    expect(f.children).toHaveLength(1);
    const geo = (f.children[0] as THREE.Mesh).geometry;
    expect(geo.getAttribute("uv")).toBeDefined();
    const col = geo.getAttribute("color");
    expect(col.count).toBe(72);
    expect(col.getX(0)).toBeCloseTo(0.5);
    expect(col.getX(71)).toBeCloseTo(1);
  });

  it("chocan el domo, los corredores y las patas del elevado; nada tapa un sendero ni un puesto", () => {
    const h = huellasColonia();
    expect(h.filter((x) => x.id.startsWith("colonia:corredor_"))).toHaveLength(CORREDORES.length - 1);
    expect(h.filter((x) => x.id.startsWith(`colonia:pata_${CORREDOR_ELEVADO.a}`))).toHaveLength(CORREDOR_ELEVADO.patas.length * 2);
    expect(h.some((x) => x.id === "colonia:habitat")).toBe(true);
    expect(h.filter((x) => x.id.startsWith("colonia:berma_")).length).toBeGreaterThan(20);
    for (const x of h) {
      if (x.id.startsWith("colonia:corredor_") || x.id.startsWith("colonia:berma_") || x.id.startsWith("colonia:pata_")) expect(sobreCamino(x.x, x.z, 0), x.id).toBe(false);
      for (const l of LUGARES) expect(distanciaAHuella(x, l.x, l.z), `${x.id} tapa ${l.id}`).toBeGreaterThan(0.2);
    }
  });

  it("la colonia entra en su parte del presupuesto y Perseverance aparece solo en su sitio", () => {
    const a = armarEscena(crearMateriales(), vista(null));
    a.ponerModelos(modelos());
    const colonia = a.escena.getObjectByName("Colony")!;
    // La colonia (kit, piezas originales, domos y paneles) se lleva menos de 32 mil de los 200 mil. [E]
    expect(triangulos(colonia)).toBeLessThan(32000);
    // Fusionada por sector y por material: pocas mallas.
    let mallas = 0;
    colonia.traverse((o) => (mallas += o instanceof THREE.Mesh ? 1 : 0));
    expect(mallas).toBeLessThanOrEqual(26);
    const nasa = a.escena.getObjectByName("NASA_Jezero")!;
    expect(nasa.visible).toBe(false);
    a.aplicarVista(vista(SITIO_PERSEVERANCE));
    expect(nasa.visible).toBe(true);
    expect(a.escena.getObjectByName("NASA_Perseverance")).toBeDefined();
    a.aplicarVista(vista("delta-occidental"));
    expect(nasa.visible).toBe(false);
    a.liberar();
  });

  it("con movimiento reducido los rotores y el tripulante quedan quietos", () => {
    const a = armarEscena(crearMateriales(), vista(SITIO_PERSEVERANCE));
    a.ponerModelos(modelos());
    const rotor = a.escena.getObjectByName("rotors_01")!;
    const caminante = a.escena.getObjectByName("Colony_Walker")!.parent!;
    a.animar(1000, true);
    const antes = { giro: rotor.rotation.y, x: caminante.position.x, z: caminante.position.z };
    a.animar(3000, true);
    expect(rotor.rotation.y).toBe(antes.giro);
    expect(caminante.position.x).toBe(antes.x);
    for (let t = 5000; t <= 7000; t += 50) a.animar(t, false);
    expect(rotor.rotation.y).not.toBe(antes.giro);
    expect(Math.hypot(caminante.position.x - antes.x, caminante.position.z - antes.z)).toBeGreaterThan(0.3);
    a.liberar();
  });

  it("al desmontar se libera entera: geometrías, materiales y texturas (con la paleta del kit)", () => {
    const m = crearMateriales();
    const a = armarEscena(m, vista(SITIO_PERSEVERANCE));
    a.ponerModelos(modelos());
    const pendientes = new Set<object>();
    const vigilar = (r: THREE.EventDispatcher<{ dispose: object }>) => {
      if (pendientes.has(r)) return;
      pendientes.add(r);
      r.addEventListener("dispose", () => pendientes.delete(r));
    };
    let texturas = 0;
    for (const nombre of ["Colony", "Colony_Habitat", "Colony_CommsTower", "NASA_Jezero", "Colony_Walker", "Module_Greenhouse"]) {
      a.escena.getObjectByName(nombre)!.traverse((o) => {
        const x = o as Partial<THREE.Mesh>;
        if (x.geometry) vigilar(x.geometry);
        const mats = Array.isArray(x.material) ? x.material : x.material ? [x.material] : [];
        for (const mat of mats) {
          vigilar(mat);
          const mapa = (mat as THREE.MeshStandardMaterial).map;
          if (mapa) {
            vigilar(mapa);
            texturas++;
          }
        }
      });
    }
    expect(texturas).toBeGreaterThan(0);
    expect(pendientes.size).toBeGreaterThan(20);
    a.liberar();
    liberarEscena(a.escena, { compartidos: true });
    liberarMateriales(Object.values(m));
    expect(pendientes.size).toBe(0);
  });
});
