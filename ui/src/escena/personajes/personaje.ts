import * as THREE from "three";
import { retenerMateriales } from "./recursos";
import {
  CABEZA_ADULTA,
  CABEZA_METEOROLOGA,
  CABEZA_NINO,
  PELO_DOCTORA,
  PELO_INGENIERA,
  PELO_METEOROLOGA,
  PELO_NINO,
  construirCabeza,
  construirGafas,
  construirPelo,
  type Expresion,
  type FormaCabeza,
  type FormaPelo,
  type Gafas,
  type Rostro,
} from "./cabeza.js";
import { ADULTA_B, H, HUESOS, NINO_B, construirEquipo, construirTraje, peso, type NombreHueso, type Silueta } from "./cuerpo.js";
import { FICHAS, type IdPersonaje, type Proporciones } from "./fichas.js";
import type { V3 } from "./malla.js";
import { crearRostroB, type RasgosB } from "./rostro.js";
import { Superficie, type Sonda, type Topologia } from "./superficie.js";

/**
 * Tripulante completo en malla cerrada (propuesta B aprobada): cuerpo y cabeza son superficies
 * cerradas de vértices compartidos con pesos mezclados en articulaciones; el rostro proyecta ocho
 * expresiones sobre la piel y el casco es un visor translúcido separado. Tres llamadas de dibujo.
 */

export { HUESOS, type NombreHueso };

export interface Personaje {
  id: IdPersonaje;
  grupo: THREE.Group;
  huesos: Record<NombreHueso, THREE.Bone>;
  rostro: Rostro;
  altura: number;
  proporciones: Proporciones;
  /** Altura de la pelvis en reposo, en fracción de altura: base para agacharse o rebotar al caminar. */
  reposoPelvis: number;
  /** Medidas de la malla lógica por pieza, para revisión y pruebas. */
  topologia: Record<string, Topologia>;
  expresion(e: Expresion): void;
  liberar(): void;
}

interface FichaConstruccion {
  silueta: Silueta;
  cabeza: FormaCabeza;
  pelo: FormaPelo;
  gafas?: Gafas;
  rasgos: Omit<RasgosB, "colorCeja" | "colorPiel">;
}

const FICHAS_CONSTRUCCION: Record<IdPersonaje, FichaConstruccion> = {
  ingeniera: {
    silueta: { ...ADULTA_B, antena: { ...ADULTA_B.antena, x: -0.152 } },
    cabeza: CABEZA_ADULTA,
    pelo: PELO_INGENIERA,
    rasgos: {
      ojoX: 0.214,
      ojoY: -0.068,
      ojoRx: 0.08,
      ojoRy: 0.11,
      cejaY: 0.152,
      cejaAncho: 0.165,
      cejaGrosor: 1.05,
      irisEscala: 1.06,
      bocaY: -0.335,
      bocaAncho: 0.215,
      colorIris: 0x6b3a21,
      gestos: {
        neutral: { escalaBoca: 1.06, cejaI: [0.004, -0.03], cejaD: [0.004, -0.03] },
        feliz: { escalaBoca: 1.1, cejaI: [0.028, -0.07], cejaD: [0.028, -0.07] },
        pensando: { mirada: [0.014, 0.016], cejaI: [-0.008, 0.16], cejaD: [0.03, -0.12] },
        preocupado: { cejaI: [0.012, 0.32], cejaD: [0.012, 0.32] },
        hablaAbierta: { escalaBoca: 0.9, cejaI: [0.016, -0.04], cejaD: [0.016, -0.04] },
        hablaRedonda: { cejaI: [0.02, -0.02], cejaD: [0.02, -0.02] },
      },
    },
  },
  doctora: {
    silueta: ADULTA_B,
    cabeza: CABEZA_ADULTA,
    pelo: PELO_DOCTORA,
    gafas: { x: 0.215, y: -0.065, radio: 0.15, grosor: 0.034 },
    rasgos: { ojoX: 0.215, ojoY: -0.07, ojoRx: 0.078, ojoRy: 0.108, cejaY: 0.15, cejaAncho: 0.16, bocaY: -0.335, bocaAncho: 0.2, colorIris: 0x3b2218 },
  },
  nino: {
    silueta: NINO_B,
    cabeza: CABEZA_NINO,
    pelo: PELO_NINO,
    rasgos: {
      ojoX: 0.205,
      ojoY: -0.095,
      ojoRx: 0.084,
      ojoRy: 0.114,
      cejaY: 0.125,
      cejaAncho: 0.15,
      cejaGrosor: 1.1,
      irisEscala: 1.13,
      bocaY: -0.345,
      bocaAncho: 0.21,
      colorIris: 0x3a2015,
      gestos: {
        neutral: { escalaBoca: 1.12, cejaI: [0.012, -0.04], cejaD: [0.012, -0.04] },
        feliz: { escalaBoca: 1.15, cejaI: [0.03, -0.08], cejaD: [0.03, -0.08] },
        pensando: { boca: "redonda", escalaBoca: 0.86, mirada: [0.012, 0.02], cejaI: [0.04, -0.12], cejaD: [0.024, -0.02] },
        preocupado: { cejaI: [0.02, 0.42], cejaD: [0.02, 0.42] },
        hablaCerrada: { escalaBoca: 1.05, cejaI: [0.01, -0.03], cejaD: [0.01, -0.03] },
        hablaAbierta: { escalaBoca: 0.92, cejaI: [0.02, -0.05], cejaD: [0.02, -0.05] },
        hablaRedonda: { cejaI: [0.024, -0.02], cejaD: [0.024, -0.02] },
      },
    },
  },
  meteorologa: {
    silueta: ADULTA_B,
    cabeza: CABEZA_METEOROLOGA,
    pelo: PELO_METEOROLOGA,
    rasgos: {
      ojoX: 0.212,
      ojoY: -0.062,
      ojoRx: 0.074,
      ojoRy: 0.1,
      cejaY: 0.15,
      cejaAncho: 0.17,
      cejaGrosor: 0.85,
      irisEscala: 1.1,
      parpado: 0.1,
      bocaY: -0.335,
      bocaAncho: 0.2,
      colorIris: 0x4b3326,
      colorContorno: 0x3d3140,
      gestos: {
        neutral: { cejaI: [0.014, -0.07], cejaD: [0.002, -0.01] },
        feliz: { ojos: "abiertos", escalaBoca: 1.05, cejaI: [0.036, -0.1], cejaD: [0.036, -0.1] },
        pensando: { mirada: [-0.016, 0.02], cejaI: [0.036, -0.16], cejaD: [-0.014, 0.2] },
        preocupado: { cejaI: [0.012, 0.3], cejaD: [0.012, 0.3] },
        hablaCerrada: { cejaI: [0.014, -0.07], cejaD: [0.002, -0.01] },
        hablaAbierta: { escalaBoca: 0.86, cejaI: [0.026, -0.08], cejaD: [0.018, -0.04] },
        hablaRedonda: { cejaI: [0.03, -0.06], cejaD: [0.02, 0] },
      },
    },
  },
};

const materialCuerpo = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
materialCuerpo.userData.compartido = true;
const materialCasco = new THREE.MeshStandardMaterial({
  color: 0xd3aeea,
  transparent: true,
  opacity: 0.58,
  roughness: 0.7,
  metalness: 0,
  flatShading: true,
  depthWrite: false,
  side: THREE.BackSide,
});
materialCasco.userData.compartido = true;

const PIEZAS = ["traje", "cara", "oreja", "nariz", "cuello", "pelo", "gafas", "equipo"];

export function crearPersonaje(id: IdPersonaje): Personaje {
  const b = FICHAS_CONSTRUCCION[id];
  const f = FICHAS[id];
  const d = b.silueta;
  const c = f.paleta;
  const s = new Superficie();

  construirTraje(s, c, d);
  construirEquipo(s, c, d, {
    bolso: f.bolso ?? false,
    emblema: f.emblema === "ninguno" ? undefined : f.emblema,
    rinoneras: f.rinoneras,
    herramienta: id === "ingeniera" ? "llave" : id === "meteorologa" ? "catalejo" : undefined,
  });

  const u = d.craneo.alto;
  const aMundo = (q: V3): V3 => [q[0] * u, d.craneo.y + q[1] * u, q[2] * u];
  const W = peso("cabeza");
  construirCabeza(s, c, b.cabeza, aMundo, W);

  // Cuello: une el tronco con la cabeza; abajo sigue al torso y arriba a la cabeza.
  s.etiqueta = "cuello";
  const aro = (y: number, r: number, w: typeof W) =>
    s.anillo(
      Array.from({ length: 8 }, (_, k): V3 => {
        const t = (k * Math.PI) / 4;
        return [Math.sin(t) * r, y, d.cuello.z + Math.cos(t) * r];
      }),
      w,
    );
  const bajo = aro(d.cuello.y0, d.cuello.r * 1.08, peso("torso"));
  const alto = aro(d.cuello.y1, d.cuello.r, W);
  s.puente(bajo, alto, c.pielSombra, { suave: true });
  s.cara(bajo, c.pielSombra);
  s.cara(alto, c.pielSombra);

  construirPelo(s, f.pelo.color, b.cabeza, b.pelo, aMundo, W);

  // Sonda de la cara en altos de cráneo: la usan las gafas y el rostro.
  const cara = s.sonda(["cara"]);
  const sonda: Sonda = (x, y) => {
    const h = cara(x * u, d.craneo.y + y * u);
    return h && { z: h.z / u, n: h.n };
  };
  if (b.gafas) construirGafas(s, b.gafas, b.cabeza, (x, y) => sonda(x, y)?.z ?? 0.4, aMundo, W);

  const articulacion: Record<NombreHueso, V3> = {
    pelvis: [0, d.cadera[1] + 0.04, 0],
    torso: [0, d.tronco.find((r) => r.pesos.length === 2)?.y ?? 0.52, 0],
    cabeza: [0, d.cuello.y0 + 0.024, d.cuello.z],
    brazoI: d.hombro,
    antebrazoI: d.codo,
    manoI: d.muneca,
    brazoD: [-d.hombro[0], d.hombro[1], d.hombro[2]],
    antebrazoD: [-d.codo[0], d.codo[1], d.codo[2]],
    manoD: [-d.muneca[0], d.muneca[1], d.muneca[2]],
    musloI: d.cadera,
    espinillaI: d.rodilla,
    pieI: d.tobillo,
    musloD: [-d.cadera[0], d.cadera[1], d.cadera[2]],
    espinillaD: [-d.rodilla[0], d.rodilla[1], d.rodilla[2]],
    pieD: [-d.tobillo[0], d.tobillo[1], d.tobillo[2]],
    tableta: [-d.muneca[0], d.muneca[1], d.muneca[2]],
    llave: [-d.muneca[0], d.muneca[1], d.muneca[2]],
    catalejo: [-d.muneca[0], d.muneca[1], d.muneca[2]],
  };
  const padre: Partial<Record<NombreHueso, NombreHueso>> = {
    torso: "pelvis",
    cabeza: "torso",
    brazoI: "torso",
    antebrazoI: "brazoI",
    manoI: "antebrazoI",
    brazoD: "torso",
    antebrazoD: "brazoD",
    manoD: "antebrazoD",
    musloI: "pelvis",
    espinillaI: "musloI",
    pieI: "espinillaI",
    musloD: "pelvis",
    espinillaD: "musloD",
    pieD: "espinillaD",
    tableta: "manoD",
    llave: "manoD",
    catalejo: "manoD",
  };
  const huesos = {} as Record<NombreHueso, THREE.Bone>;
  for (const n of HUESOS) {
    huesos[n] = new THREE.Bone();
    huesos[n].name = n;
  }
  for (const n of HUESOS) {
    const pa = padre[n];
    const a = articulacion[n];
    const o: V3 = pa ? articulacion[pa] : [0, 0, 0];
    huesos[n].position.set(a[0] - o[0], a[1] - o[1], a[2] - o[2]);
    if (pa) huesos[pa].add(huesos[n]);
  }

  const escala = new THREE.Group();
  escala.scale.setScalar(f.altura);
  escala.add(huesos.pelvis);
  const grupo = new THREE.Group();
  grupo.name = `personaje-${id}`;
  grupo.add(escala);
  grupo.updateMatrixWorld(true);

  const geometria = s.geometria();
  const cuerpo = new THREE.SkinnedMesh(geometria, materialCuerpo);
  cuerpo.name = "cuerpo";
  cuerpo.frustumCulled = false;
  cuerpo.castShadow = true;
  cuerpo.receiveShadow = true;
  escala.add(cuerpo);
  grupo.updateMatrixWorld(true);
  const esqueleto = new THREE.Skeleton(HUESOS.map((n) => huesos[n]));
  cuerpo.bind(esqueleto);
  // El equipo de mano nace oculto; `animar` lo muestra según el gesto.
  for (const n of ["tableta", "llave", "catalejo"] as const) huesos[n].scale.setScalar(0);
  let liberado = false;

  const gCasco = new THREE.IcosahedronGeometry(1, 1);
  const casco = new THREE.Mesh(gCasco, materialCasco);
  casco.name = "casco";
  casco.renderOrder = 1;
  casco.scale.set(d.casco.rx, d.casco.ry, d.casco.rz);
  casco.position.set(0, d.casco.y - articulacion.torso[1], d.casco.z);
  huesos.torso.add(casco);

  const rostro = crearRostroB({ ...b.rasgos, colorCeja: c.ceja, colorPiel: c.piel }, sonda);
  rostro.grupo.scale.setScalar(u);
  rostro.grupo.position.set(0, d.craneo.y - articulacion.cabeza[1], -articulacion.cabeza[2]);
  huesos.cabeza.add(rostro.grupo);
  const soltarMateriales = retenerMateriales(grupo);

  return {
    id,
    grupo,
    huesos,
    rostro,
    altura: f.altura,
    proporciones: { ...f.proporciones, casco: d.casco, cadera: d.cadera, articulacionRodilla: d.rodilla, tobillo: d.tobillo },
    reposoPelvis: huesos.pelvis.position.y,
    topologia: Object.fromEntries(PIEZAS.map((p) => [p, s.topologia(p)])),
    expresion: (e) => rostro.expresion(e),
    liberar() {
      if (liberado) return;
      liberado = true;
      soltarMateriales();
      esqueleto.dispose();
      geometria.dispose();
      gCasco.dispose();
      rostro.grupo.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    },
  };
}

export { H };
