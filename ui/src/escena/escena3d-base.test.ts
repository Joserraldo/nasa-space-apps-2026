/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LUZ, PALETA_CIELO, crearCielo, type RendererCielo } from "./cielo";
import { SLOTS, TOKENS_TEMP, cacheGeometrias, crearMateriales, geometriaBase } from "./materiales";
import { liberarCache, liberarEscena } from "./liberar";
import {
  ESCALA_VERTICAL_POR_DEFECTO,
  PASO_POR_DEFECTO,
  PRESUPUESTO,
  TAMANO_MUNDO_POR_DEFECTO,
  contarRender,
  crearRocas,
  crearTerreno,
  leerDem,
  submuestrear,
  type OpcionesMalla,
} from "./activos/terreno";

const dir = (f: string) => fileURLToPath(new URL(`../../../data/terreno/jezero/${f}`, import.meta.url));
const { dem } = JSON.parse(readFileSync(dir("jezero.json"), "utf-8")) as {
  dem: { archivo: string; ancho: number; alto: number; metrosPorPixel: number };
};
const archivo = readFileSync(dir(dem.archivo));
const buffer = archivo.buffer.slice(archivo.byteOffset, archivo.byteOffset + archivo.byteLength) as ArrayBuffer;
const rejilla = submuestrear(leerDem(buffer, dem.ancho, dem.alto), dem.ancho, dem.alto, PASO_POR_DEFECTO);
const malla: OpcionesMalla = {
  metrosPorPixel: dem.metrosPorPixel * PASO_POR_DEFECTO,
  escalaVertical: ESCALA_VERTICAL_POR_DEFECTO,
  tamañoMundo: TAMANO_MUNDO_POR_DEFECTO,
};
/** Rocas de la vista exterior. [E] */
const N_ROCAS = 60;

function montar(calidad: "alta" | "baja" = "alta") {
  const escena = new THREE.Scene();
  const materiales = crearMateriales();
  const cielo = crearCielo(escena, "dia", calidad);
  const terreno = crearTerreno(materiales, { rejilla, malla });
  const rocas = crearRocas(materiales, terreno, N_ROCAS, 42);
  escena.add(terreno.malla, rocas);
  return { escena, materiales, cielo, terreno, rocas };
}

afterEach(() => {
  liberarCache();
});

describe("materiales por slot", () => {
  it("crea los 9 slots, todos con facetas planas y compartidos", () => {
    const m = crearMateriales();
    expect(Object.keys(m).sort()).toEqual([...SLOTS].sort());
    expect(SLOTS).toHaveLength(9);
    for (const s of SLOTS) {
      expect(m[s].flatShading, s).toBe(true);
      expect(m[s].userData.compartido).toBe(true);
    }
  });

  it("el vidrio es transparente de una cara y sin transmission; nunca opaco", () => {
    const { Glass } = crearMateriales();
    expect(Glass.transparent).toBe(true);
    expect(Glass.opacity).toBeLessThan(1);
    expect(Glass.side).toBe(THREE.FrontSide);
  });

  it("los colores salen de TOKENS_TEMP", () => {
    const m = crearMateriales();
    expect(m.SuitBase.color.getHexString()).toBe(TOKENS_TEMP["traje-marfil"].slice(1).toLowerCase());
    expect(m.Boots.color.getHexString()).toBe(TOKENS_TEMP["indigo-botas"].slice(1).toLowerCase());
    expect(m.Rock.vertexColors).toBe(true);
  });

  it("la caché crea cada geometría una sola vez", () => {
    const fabrica = vi.fn(() => new THREE.BoxGeometry());
    const a = geometriaBase("caja", fabrica);
    const b = geometriaBase("caja", fabrica);
    expect(a).toBe(b);
    expect(fabrica).toHaveBeenCalledTimes(1);
    expect(cacheGeometrias().size).toBe(1);
  });
});

describe("liberar", () => {
  it("libera cada geometría, material y textura propios una sola vez y respeta lo compartido", () => {
    const textura = new THREE.Texture();
    const propio = new THREE.MeshStandardMaterial({ map: textura });
    const geoPropia = new THREE.BoxGeometry();
    const compartida = geometriaBase("caja", () => new THREE.BoxGeometry());
    const { Rock } = crearMateriales();
    const grupo = new THREE.Group();
    grupo.add(new THREE.Mesh(geoPropia, propio), new THREE.Mesh(geoPropia, propio), new THREE.Mesh(compartida, Rock));
    const espias = [textura, propio, geoPropia, compartida, Rock].map((r) => vi.spyOn(r, "dispose"));

    expect(liberarEscena(grupo)).toEqual({ geometrias: 1, materiales: 1, texturas: 1 });
    liberarEscena(grupo); // doble montaje: no repite
    const [t, m, g, c, r] = espias;
    expect(t).toHaveBeenCalledTimes(1);
    expect(m).toHaveBeenCalledTimes(1);
    expect(g).toHaveBeenCalledTimes(1);
    expect(c).not.toHaveBeenCalled();
    expect(r).not.toHaveBeenCalled();

    expect(liberarCache()).toBe(1);
    expect(c).toHaveBeenCalledTimes(1);
    expect(cacheGeometrias().size).toBe(0);
  });

  it("con compartidos: true no deja nada de la escena montada sin dispose", () => {
    const { escena } = montar();
    const recursos = new Set<{ dispose(): void }>();
    escena.traverse((o) => {
      const x = o as Partial<THREE.Mesh>;
      if (x.geometry) recursos.add(x.geometry);
      if (x.material) recursos.add(x.material as THREE.Material);
    });
    const espias = [...recursos].map((r) => vi.spyOn(r, "dispose"));
    liberarEscena(escena, { compartidos: true });
    for (const e of espias) expect(e).toHaveBeenCalledTimes(1);
  });
});

describe("cielo de Marte (Three)", () => {
  it("el domo nunca es azul fuera del halo y la niebla es el horizonte", () => {
    const escena = new THREE.Scene();
    const cielo = crearCielo(escena, "dia");
    expect(cielo.niebla.color.getHexString()).toBe(new THREE.Color(PALETA_CIELO.dia.horizonte).getHexString());
    expect(PALETA_CIELO.dia.niebla).toBe(PALETA_CIELO.dia.horizonte);
    const pos = cielo.domo.geometry.getAttribute("position");
    const col = cielo.domo.geometry.getAttribute("color");
    const sol = new THREE.Vector3(...LUZ.direccionSol);
    const v = new THREE.Vector3();
    let azules = 0;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      if (col.getZ(i) >= col.getX(i)) {
        azules++;
        expect(v.angleTo(sol), `vértice ${i}`).toBeLessThan(0.25); // solo junto al Sol
      }
    }
    expect(azules / pos.count).toBeLessThan(0.02);
    expect((cielo.domo.material as THREE.MeshBasicMaterial).fog).toBe(false);
  });

  it("luz: direccional arriba a la izquierda, sombras 1024/512, hemisférica cielo=horizonte suelo=regolito", () => {
    const alta = crearCielo(new THREE.Scene(), "dia", "alta");
    const baja = crearCielo(new THREE.Scene(), "dia", "baja");
    expect(alta.sol.position.x).toBeLessThan(0);
    expect(alta.sol.position.y).toBeGreaterThan(0);
    expect(alta.sol.castShadow).toBe(true);
    expect(alta.sol.shadow.mapSize.x).toBe(1024);
    expect(baja.sol.shadow.mapSize.x).toBe(512);
    expect(alta.hemisferica.color.getHexString()).toBe(new THREE.Color(PALETA_CIELO.dia.horizonte).getHexString());
    expect(alta.hemisferica.groundColor.getHexString()).toBe(new THREE.Color(TOKENS_TEMP["regolito-medio"]).getHexString());
  });

  it("aplica ACES y exposición 1,06 al renderer, y quitar() limpia la escena", () => {
    const escena = new THREE.Scene();
    const cielo = crearCielo(escena);
    const renderer = { toneMapping: THREE.NoToneMapping, toneMappingExposure: 1, shadowMap: { enabled: false, type: THREE.BasicShadowMap } } as unknown as RendererCielo;
    cielo.aplicarRenderer(renderer);
    expect(renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping);
    expect(renderer.toneMappingExposure).toBe(1.06);
    expect(renderer.shadowMap.enabled).toBe(true);
    cielo.quitar();
    expect(escena.children).toHaveLength(0);
    expect(escena.fog).toBeNull();
  });

  it("quitar() restaura el background anterior, salvo que otro lo haya cambiado", () => {
    const previo = new THREE.Color("#112233");
    const escena = new THREE.Scene();
    escena.background = previo;
    crearCielo(escena).quitar();
    expect(escena.background).toBe(previo);

    const ajeno = new THREE.Color("#445566");
    const otra = new THREE.Scene();
    const cielo = crearCielo(otra);
    otra.background = ajeno;
    cielo.quitar();
    expect(otra.background).toBe(ajeno);
  });
});

describe("terreno y rocas (Three)", () => {
  it("el terreno es no indexado, con normales planas hacia arriba y material Rock", () => {
    const { terreno, materiales } = montar();
    const g = terreno.malla.geometry;
    expect(g.index).toBeNull();
    expect(terreno.malla.material).toBe(materiales.Rock);
    expect(g.getAttribute("color").count).toBe(g.getAttribute("position").count);
    const n = g.getAttribute("normal");
    for (let v = 0; v < n.count; v += 3) {
      expect(n.getY(v)).toBeGreaterThan(0);
      // Normal plana: los tres vértices del triángulo comparten normal.
      expect(n.getY(v + 1)).toBe(n.getY(v));
      expect(n.getY(v + 2)).toBe(n.getY(v));
    }
  });

  it("las rocas son una InstancedMesh (1 draw call) con la geometría maestra compartida", () => {
    const { rocas } = montar();
    expect(rocas).toBeInstanceOf(THREE.InstancedMesh);
    expect(rocas.count).toBe(N_ROCAS);
    expect(rocas.geometry.userData.compartido).toBe(true);
    const solo = new THREE.Scene();
    solo.add(rocas);
    expect(contarRender(solo).drawCalls).toBe(1);
  });

  it("la roca tiene cara superior más clara que los lados", () => {
    const { rocas } = montar();
    const n = rocas.geometry.getAttribute("normal");
    const c = rocas.geometry.getAttribute("color");
    const arriba = new THREE.Color(TOKENS_TEMP["regolito-medio"]);
    const lados = new THREE.Color(TOKENS_TEMP["roca-basalto"]);
    expect(arriba.getHSL({ h: 0, s: 0, l: 0 }).l).toBeGreaterThan(lados.getHSL({ h: 0, s: 0, l: 0 }).l);
    let superiores = 0;
    for (let v = 0; v < n.count; v += 3) {
      if (n.getY(v) > 0.7) {
        superiores++;
        expect(c.getX(v)).toBeCloseTo(arriba.r, 5);
      } else expect(c.getX(v)).toBeCloseTo(lados.r, 5);
    }
    expect(superiores).toBeGreaterThan(0);
  });
});

describe("presupuesto de cielo + terreno + rocas", () => {
  it.each(["alta", "baja"] as const)("calidad %s: ≤ 15 draw calls y ≤ 25 000 triángulos", (calidad) => {
    const { escena } = montar(calidad);
    const c = contarRender(escena);
    expect(c.drawCalls).toBeLessThanOrEqual(15);
    expect(c.triangulos).toBeLessThanOrEqual(25000);
    expect(c.drawCalls).toBeLessThanOrEqual(PRESUPUESTO.drawCalls);
    console.info(`cielo+terreno+rocas (${calidad}): ${c.drawCalls} draw calls, ${c.triangulos} triángulos`);
  });
});
