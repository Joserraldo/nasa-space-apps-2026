/**
 * Cielo y luz de Marte: constantes y funciones puras arriba; `crearCielo` (Three.js) al final.
 *
 * Etapa A (luz, atmósfera y color, 17 nov). Hechos que guían el arte (PROMPT-MARTE-POR-ETAPAS, Parte 1):
 * - De día el cielo de Marte es caramelo/ocre por el polvo; las sombras son más suaves y tintadas que en
 *   la Tierra. Al atardecer hay un halo azulado alrededor del Sol. De noche, estrellas y sin bruma.
 * - Una tormenta SOLAR (radiación) no cambia el cielo: la alerta va en la UI y en luces locales ámbar.
 *
 * El domo es un shader por píxel (gradiente, halo, disco del Sol). El mismo shader, con el suelo de
 * regolito debajo del horizonte y su propia escala, se dibuja en `escenaEntorno` para el `envMap` (PMREM):
 * metal y vidrio reflejan este cielo y el cielo rellena las sombras. Los colores son radiancia lineal de
 * escena: pasan por AgX y la gradación (`atmosfera.ts`) como todo lo demás.
 */

import * as THREE from "three";
import { DENSIDAD_NIEBLA, instalarAtmosfera, toneMappingExterior } from "./atmosfera";

export type Ambiente = "dia" | "atardecer" | "noche";
export type Calidad = "alta" | "baja";
export type Rgb = [number, number, number];

export interface PaletaCielo {
  /** Color en lo alto del cielo. */
  cenit: string;
  /** Color junto al horizonte. */
  horizonte: string;
  /** Halo alrededor del Sol. */
  halo: string;
  /** Color de la niebla de distancia (perspectiva aérea). */
  niebla: string;
  /** Brillo del cielo (multiplica cénit, horizonte y niebla; radiancia lineal antes de AgX). [E] */
  brillo: number;
}

export const PALETA_CIELO: Readonly<Record<Ambiente, Readonly<PaletaCielo>>> = {
  // Día: caramelo/ocre (panorámicas de Perseverance en Jezero y Curiosity en Gale). Horizonte más claro y
  // amarillo por el polvo, cénit más oscuro y rojizo. Nunca blanco lechoso ni azul.
  dia: {
    cenit: "#9A5636",
    horizonte: "#DDA472",
    halo: "#F2DCC2", // de día el brillo junto al Sol es blanco cálido
    niebla: "#C98A5C", // caramelo, un poco más oscuro que el horizonte para que las siluetas se lean
    brillo: 1.15,
  },
  // Atardecer: el resto del cielo se apaga a pardo y el halo junto al Sol es azul.
  atardecer: {
    cenit: "#3A2E36",
    horizonte: "#A2684A",
    halo: "#7FA6D8",
    niebla: "#8A5B43",
    brillo: 0.78,
  },
  // Noche: cielo casi negro con un resto pardo en el horizonte; sin bruma.
  noche: {
    cenit: "#05060C",
    horizonte: "#1B1820",
    halo: "#000000",
    niebla: "#141219",
    brillo: 0.35,
  },
};

/** Tamaño relativo del halo junto al Sol (pequeño de día, más grande al atardecer). [E] */
export const TAMANO_HALO: Readonly<Record<Ambiente, number>> = { dia: 1, atardecer: 1.6, noche: 0 };

/** Tokens de DISEÑO.md §2.3 que usa la luz. */
export const REGOLITO_MEDIO = "#9E5340";
/** Sombras teñidas de lila, nunca negras (DISEÑO.md §2.3 `sombra-suelo`, §3.3). */
export const SOMBRA_SUELO = "#F8B9B2";
/**
 * Relleno de la hemisférica (sin entorno, calidad baja): malva apagado entre el caramelo del cielo y el
 * lila de DISEÑO; las sombras quedan levemente frías sin lavar los blancos.
 */
export const LILA_RELLENO = "#B8A3A8";
/** Marfil de referencia para calibrar la exposición (MARTE.md §5). */
export const MARFIL_CALIBRACION = "#F3EEE5";

function normalizar(v: Rgb): Rgb {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
}

/**
 * Parámetros de luz. Convención de ejes de Three: +x derecha, +y arriba, +z hacia la cámara.
 * `direccionSol` apunta DESDE la escena HACIA el Sol.
 */
export const LUZ = {
  direccionSol: normalizar([-0.8, 0.65, 0.2]),
  /** Direccional: Sol cálido y fuerte. [E] */
  colorSol: "#FFE8D0",
  /** Hemisférica: suelo = `regolito-medio` (rebote cálido); cielo de día = relleno malva, al atardecer = horizonte. */
  hemisferica: {
    dia: { cielo: LILA_RELLENO, suelo: REGOLITO_MEDIO },
    atardecer: { cielo: PALETA_CIELO.atardecer.horizonte, suelo: REGOLITO_MEDIO },
    noche: { cielo: "#6A7BB0", suelo: "#3E2E2C" },
  } as Readonly<Record<Ambiente, { cielo: string; suelo: string }>>,
  /** `mapSize` de la sombra: 2048 en alta y 1024 en media/baja para bordes nítidos (bloque 1). */
  tamanoSombra: { alta: 2048, baja: 1024 } as Readonly<Record<Calidad, number>>,
  /** Curva base de la gradación (`atmosfera.ts`): AgX, con curva en S, tono partido y saturación encima. */
  toneMapping: "AgX" as const,
  exposicion: 1.0,
  /** Puntuales activas como máximo (pantallas, balizas, faros de Iris). */
  maxPuntuales: 2,
} as const;

/** "#RRGGBB" → [r, g, b] en 0–1 (sRGB, sin convertir). */
export function hexARgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m || m[1] === undefined) throw new Error(`Color hex inválido: ${hex}`);
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Un canal sRGB 0–1 → lineal 0–1 (curva sRGB estándar, la misma de Three). */
export function srgbALineal(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** "#RRGGBB" → [r, g, b] lineal 0–1. */
export function hexALineal(hex: string): Rgb {
  const [r, g, b] = hexARgb(hex);
  return [srgbALineal(r), srgbALineal(g), srgbALineal(b)];
}

/**
 * Color del cielo a la altura `t` (0 = horizonte, 1 = cénit) para un ambiente, sin el brillo.
 * Interpola en lineal; devuelve [r, g, b] LINEAL 0–1. En t=0 y t=1 da exactamente los extremos.
 */
export function colorCielo(t: number, ambiente: Ambiente = "dia"): Rgb {
  const p = PALETA_CIELO[ambiente];
  const h = hexALineal(p.horizonte);
  const c = hexALineal(p.cenit);
  const k = Math.min(1, Math.max(0, t));
  return [(1 - k) * h[0] + k * c[0], (1 - k) * h[1] + k * c[1], (1 - k) * h[2] + k * c[2]];
}

// ---------------------------------------------------------------------------------------------
// Wrapper Three.js. Valores [E] a calibrar con la cámara real.
// ---------------------------------------------------------------------------------------------

/** Radio del domo del cielo (u = m). Debe quedar dentro del `far` de la cámara. [E] */
export const RADIO_DOMO = 450;
/** Niebla lineal de respaldo (sin `nieblaAltura`): la misma de antes de la Etapa A. [E] */
export const NIEBLA = { cerca: 80, lejos: 520 } as const;
/** Radio angular (rad) del halo de día; se multiplica por `TAMANO_HALO`. [E] */
export const RADIO_HALO = 0.16;
/** Radio angular del disco del Sol (rad). Desde Marte el Sol mide ~2/3 del que se ve desde la Tierra; aquí algo mayor para leerse. [E] */
export const RADIO_DISCO_SOL = 0.009;
/**
 * Intensidades (luces físicas de Three r160). Etapa A: Sol más fuerte y relleno más oscuro; con entorno
 * el cielo (PMREM) rellena las sombras y la hemisférica baja a `hemisfericaConEntorno`. Objetivo: sombra
 * de suelo al 20-30 % del suelo al sol (luminancia lineal de pantalla). [E] a aprobar por María Paula.
 */
export const INTENSIDAD = { sol: 3.4, hemisferica: 0.75, hemisfericaConEntorno: 0.12, noche: 0.7 } as const;
/**
 * Escala del cielo cuando se dibuja para el entorno (PMREM): separa cuánto rellena el cielo las sombras de
 * cuán claro se ve el domo. Y el brillo del regolito debajo del horizonte (rebote cálido). [E]
 */
export const ENTORNO = { escalaCielo: 0.55, suelo: REGOLITO_MEDIO, brilloSuelo: 0.32 } as const;
/** Media caja de la cámara de sombras alrededor de la base, cuando nada la mueve. [E] */
const CAJA_SOMBRA = 40;
/** Distancia del Sol al centro de la caja de sombra (m); el rango de profundidad va de 100 a 200. [E] */
const DISTANCIA_SOL = 150;

/**
 * Cámara de sombra que sigue al niño (D2, #24): con la caja fija de 80 m, 512 px en `media` daban
 * 16 cm por píxel y el niño casi no proyectaba sombra. Media caja por calidad y cuánto se adelanta
 * el centro hacia donde mira la cámara. [E]
 */
export const SOMBRA_SEGUIDA = { mediaCaja: { alta: 20, media: 16, baja: 16 }, adelante: 6 } as const;

const rotLuz = new THREE.Matrix4();
const ejeX = new THREE.Vector3();
const ejeY = new THREE.Vector3();
const ejeZ = new THREE.Vector3();
/** Dirección hacia el Sol en este momento (la cambia el ciclo del día, D3); por defecto la de `LUZ`. */
const DIR_SOL = new THREE.Vector3();
const ORIGEN = new THREE.Vector3();
const ARRIBA = new THREE.Vector3(0, 1, 0);

/** Fija la dirección hacia el Sol (normalizada) que usan la sombra que sigue al niño y el domo. */
export function fijarDireccionSol(x: number, y: number, z: number): void {
  DIR_SOL.set(x, y, z).normalize();
  rotLuz.lookAt(DIR_SOL, ORIGEN, ARRIBA).extractBasis(ejeX, ejeY, ejeZ);
}

/** Dirección hacia el Sol vigente (copia). */
export function direccionSolActual(destino = new THREE.Vector3()): THREE.Vector3 {
  return destino.copy(DIR_SOL);
}
fijarDireccionSol(...LUZ.direccionSol);

/**
 * Centro de la caja de sombra para un punto del suelo, ajustado a la grilla de píxeles de sombra en
 * el plano de la luz: así la caja se mueve de a un píxel entero y los bordes de sombra no tiemblan.
 */
export function centroSombra(x: number, z: number, mediaCaja: number, lado: number, destino = new THREE.Vector3()): THREE.Vector3 {
  const paso = (2 * mediaCaja) / lado;
  const p = new THREE.Vector3(x, 0, z);
  const u = Math.round(p.dot(ejeX) / paso) * paso;
  const v = Math.round(p.dot(ejeY) / paso) * paso;
  const w = p.dot(ejeZ);
  return destino.copy(ejeX).multiplyScalar(u).addScaledVector(ejeY, v).addScaledVector(ejeZ, w);
}

/** Mueve el Sol y su blanco para que la caja de sombra (media caja `mediaCaja`) quede centrada en `centro`. */
export function seguirConSombra(sol: THREE.DirectionalLight, centro: THREE.Vector3, mediaCaja: number): void {
  const cam = sol.shadow.camera;
  if (cam.right !== mediaCaja) {
    cam.left = -mediaCaja; cam.right = mediaCaja; cam.top = mediaCaja; cam.bottom = -mediaCaja;
    cam.updateProjectionMatrix();
  }
  sol.target.position.copy(centro);
  sol.position.copy(centro).addScaledVector(DIR_SOL, DISTANCIA_SOL);
  sol.target.updateMatrixWorld();
}

/** Lo mínimo del renderer que toca el cielo (así se prueba sin WebGL). */
export type RendererCielo = Pick<THREE.WebGLRenderer, "toneMapping" | "toneMappingExposure" | "shadowMap">;

/** Estado del cielo en un momento: lo calcula `estadoCielo` y lo aplica `Cielo.pintar`. */
export interface EstadoCielo {
  /** 0 = día, 1 = atardecer. */
  mezcla: number;
  /** 0 = sin noche, 1 = noche cerrada (estrellas visibles). */
  noche: number;
  /** Dirección hacia el Sol (normalizada). */
  dirSol: Readonly<{ x: number; y: number; z: number }>;
}

/** Colores y brillos del cielo (lineales, con el brillo ya aplicado) para un estado. Funciones puras. */
export interface ColoresCielo {
  cenit: Rgb;
  horizonte: Rgb;
  halo: Rgb;
  niebla: Rgb;
  /** Radio angular del halo (rad). */
  radioHalo: number;
  /** Intensidad del halo y del disco del Sol (0 de noche o con el Sol bajo el horizonte). */
  brilloHalo: number;
  brilloDisco: number;
  densidadNiebla: number;
}

const mezclar = (a: Rgb, b: Rgb, k: number): Rgb => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const escalar = (a: Rgb, k: number): Rgb => [a[0] * k, a[1] * k, a[2] * k];

function suave(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Colores del cielo de un ambiente con su brillo. */
function paleta(amb: Ambiente) {
  const p = PALETA_CIELO[amb];
  return {
    cenit: escalar(hexALineal(p.cenit), p.brillo),
    horizonte: escalar(hexALineal(p.horizonte), p.brillo),
    halo: hexALineal(p.halo),
    niebla: escalar(hexALineal(p.niebla), p.brillo),
  };
}

/** Mezcla día → atardecer (`mezcla`) y luego → noche (`noche`). */
export function coloresCielo(e: EstadoCielo): ColoresCielo {
  const d = paleta("dia"), a = paleta("atardecer"), n = paleta("noche");
  const k = Math.min(1, Math.max(0, e.mezcla));
  const q = Math.min(1, Math.max(0, e.noche));
  const tarde = <K extends keyof typeof d>(c: K) => mezclar(mezclar(d[c], a[c], k), n[c], q);
  // El halo y el disco se apagan cuando el Sol cruza el horizonte.
  const sobre = suave(-0.06, 0.02, e.dirSol.y);
  return {
    cenit: tarde("cenit"),
    horizonte: tarde("horizonte"),
    halo: mezclar(d.halo, a.halo, k),
    niebla: tarde("niebla"),
    radioHalo: RADIO_HALO * (TAMANO_HALO.dia + (TAMANO_HALO.atardecer - TAMANO_HALO.dia) * k),
    brilloHalo: (1.1 - 0.55 * k) * sobre * (1 - q),
    brilloDisco: 40 * (1 - 0.5 * k) * sobre * (1 - q),
    densidadNiebla:
      DENSIDAD_NIEBLA.dia + (DENSIDAD_NIEBLA.atardecer - DENSIDAD_NIEBLA.dia) * k + (DENSIDAD_NIEBLA.noche - DENSIDAD_NIEBLA.atardecer) * q,
  };
}

/** Domo y entorno: un solo shader; `uEntorno` = 1 pinta regolito debajo del horizonte y quita el disco del Sol. */
const CIELO_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
	vDir = ( modelMatrix * vec4( position, 0.0 ) ).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const CIELO_FRAGMENT = /* glsl */ `
uniform vec3 uCenit;
uniform vec3 uHorizonte;
uniform vec3 uHalo;
uniform vec3 uSuelo;
uniform vec3 uSol;
uniform float uRadioHalo;
uniform float uBrilloHalo;
uniform float uBrilloDisco;
uniform float uEntorno;
uniform float uEscala;
varying vec3 vDir;
void main() {
	vec3 d = normalize( vDir );
	// Banda clara ancha junto al horizonte: sqrt abre el gradiente hacia arriba.
	float t = pow( max( d.y, 0.0 ), 0.65 );
	vec3 col = mix( uHorizonte, uCenit, t );
	// Banda de bruma clara pegada al horizonte (el polvo suspendido se ve más denso de canto).
	col += uHorizonte * 0.32 * exp( - max( d.y, 0.0 ) * 14.0 );
	float cosA = clamp( dot( d, uSol ), -1.0, 1.0 );
	float ang = acos( cosA );
	// Polvo: dispersión hacia adelante. Un brillo amplio hacia el Sol y el halo cercano con su color.
	col *= 1.0 + 0.35 * uBrilloHalo * pow( max( cosA, 0.0 ), 8.0 );
	float halo = exp( - ( ang * ang ) / ( uRadioHalo * uRadioHalo ) );
	col += uHalo * halo * uBrilloHalo;
	float disco = 1.0 - smoothstep( ${RADIO_DISCO_SOL.toFixed(4)}, ${(RADIO_DISCO_SOL * 1.25).toFixed(4)}, ang );
	col += vec3( 1.0, 0.96, 0.9 ) * disco * uBrilloDisco * ( 1.0 - uEntorno );
	// Debajo del horizonte: el domo sigue el horizonte (la niebla lo tapa); el entorno ve regolito.
	float bajo = smoothstep( 0.0, 0.06, - d.y );
	col = mix( col, mix( uHorizonte, uSuelo, uEntorno ), bajo );
	gl_FragColor = vec4( col * uEscala, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface Cielo {
  domo: THREE.Mesh;
  sol: THREE.DirectionalLight;
  hemisferica: THREE.HemisphereLight;
  /** Niebla activa (de altura o lineal según `usarNieblaAltura`); comparten el mismo color. */
  niebla: THREE.FogExp2 | THREE.Fog;
  /** Estrellas (las llena `estrellas.ts` la primera vez que hace falta). Invisibles de día. */
  estrellas: THREE.Group;
  /** Escena del cielo para generar el entorno (PMREM). Solo cielo y suelo, sin la base. */
  escenaEntorno: THREE.Scene;
  /** Último estado pintado (para saber si el entorno quedó viejo). */
  readonly estado: Readonly<EstadoCielo>;
  /** Pinta domo, entorno, niebla y fondo para un estado. */
  pintar(estado: EstadoCielo): void;
  /** Niebla de altura (`FogExp2` con los chunks de `atmosfera.ts`) o la lineal de antes. */
  usarNieblaAltura(si: boolean): void;
  /** Tone mapping con gradación en media/alta (o sin tone mapping en baja sin GPU) y sombras suaves. */
  aplicarRenderer(renderer: RendererCielo, conTono?: boolean): void;
  /** Quita todo de la escena y libera el domo. */
  quitar(): void;
}

/**
 * Pinta los colores de vértice de un domo con el gradiente horizonte→cénit (compatibilidad de pruebas
 * y respaldo sin shader). El juego usa `Cielo.pintar`.
 */
export function pintarDomo(geo: THREE.BufferGeometry, k: number, dir: Readonly<{ x: number; y: number; z: number }>): void {
  const pos = geo.getAttribute("position");
  let atributo = geo.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!atributo) geo.setAttribute("color", (atributo = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3)));
  const colores = atributo.array as Float32Array;
  const c = coloresCielo({ mezcla: k, noche: 0, dirSol: dir });
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.hypot(x, y, z) || 1;
    const t = Math.sqrt(Math.max(0, y / n));
    const base = mezclar(c.horizonte, c.cenit, t);
    const angulo = Math.acos(Math.min(1, Math.max(-1, (x * dir.x + y * dir.y + z * dir.z) / n)));
    const w = Math.exp(-(angulo * angulo) / (c.radioHalo * c.radioHalo)) * c.brilloHalo;
    for (let j = 0; j < 3; j++) colores[i * 3 + j] = base[j]! + w * c.halo[j]!;
  }
  atributo.needsUpdate = true;
}

/**
 * Monta cielo, niebla y luces de Marte en `escena`: 1 direccional cálida con sombras + 1 hemisférica
 * (relleno de cielo y rebote cálido del suelo) + domo por shader + estrellas (vacías hasta la noche).
 */
export function crearCielo(escena: THREE.Scene, ambiente: Ambiente = "dia", calidad: Calidad = "alta"): Cielo {
  instalarAtmosfera();
  const uniformes = {
    uCenit: { value: new THREE.Vector3() },
    uHorizonte: { value: new THREE.Vector3() },
    uHalo: { value: new THREE.Vector3() },
    uSuelo: { value: new THREE.Vector3() },
    uSol: { value: new THREE.Vector3(...LUZ.direccionSol) },
    uRadioHalo: { value: RADIO_HALO },
    uBrilloHalo: { value: 1 },
    uBrilloDisco: { value: 0 },
  };
  const materialCielo = (entorno: boolean) =>
    new THREE.ShaderMaterial({
      name: entorno ? "Sky_Env" : "Sky",
      uniforms: { ...uniformes, uEntorno: { value: entorno ? 1 : 0 }, uEscala: { value: entorno ? ENTORNO.escalaCielo : 1 } },
      vertexShader: CIELO_VERTEX,
      fragmentShader: CIELO_FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

  const domo = new THREE.Mesh(new THREE.SphereGeometry(RADIO_DOMO, 48, 24), materialCielo(false));
  domo.name = "Sky_Dome";
  domo.renderOrder = -2;
  domo.frustumCulled = false;
  domo.castShadow = false;
  domo.receiveShadow = false;

  const escenaEntorno = new THREE.Scene();
  escenaEntorno.name = "Sky_Env_Scene";
  const domoEntorno = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), materialCielo(true));
  escenaEntorno.add(domoEntorno);

  const estrellas = new THREE.Group();
  estrellas.name = "Sky_Stars";
  estrellas.visible = false;

  const nieblaAltura = new THREE.FogExp2(0x000000, DENSIDAD_NIEBLA.dia);
  const nieblaLineal = new THREE.Fog(0x000000, NIEBLA.cerca, NIEBLA.lejos);
  nieblaLineal.color = nieblaAltura.color; // un solo color para las dos
  let niebla: THREE.FogExp2 | THREE.Fog = nieblaAltura;

  const hemi = LUZ.hemisferica[ambiente];
  const hemisferica = new THREE.HemisphereLight(new THREE.Color(hemi.cielo), new THREE.Color(hemi.suelo), INTENSIDAD.hemisferica);
  hemisferica.name = "Light_Hemi";

  const sol = new THREE.DirectionalLight(new THREE.Color(LUZ.colorSol), INTENSIDAD.sol);
  sol.name = "Light_Sun";
  const [dx, dy, dz] = LUZ.direccionSol;
  sol.position.set(dx * DISTANCIA_SOL, dy * DISTANCIA_SOL, dz * DISTANCIA_SOL);
  sol.castShadow = true;
  const lado = LUZ.tamanoSombra[calidad];
  sol.shadow.mapSize.set(lado, lado);
  const cam = sol.shadow.camera;
  cam.left = -CAJA_SOMBRA; cam.right = CAJA_SOMBRA; cam.top = CAJA_SOMBRA; cam.bottom = -CAJA_SOMBRA;
  // Rango de profundidad justo (antes 1 a 320): el mismo sesgo despega menos la sombra del pie.
  cam.near = DISTANCIA_SOL - 50; cam.far = DISTANCIA_SOL + 50;
  sol.shadow.bias = -0.0003;
  sol.shadow.normalBias = 0.02;

  const fondoAnterior = escena.background;
  const fondo = new THREE.Color();
  escena.background = fondo;
  escena.fog = niebla;
  escena.add(domo, estrellas, hemisferica, sol, sol.target);

  const suelo = hexALineal(ENTORNO.suelo);
  const estado: EstadoCielo = { mezcla: 0, noche: 0, dirSol: { x: dx, y: dy, z: dz } };

  const cielo: Cielo = {
    domo,
    sol,
    hemisferica,
    get niebla() {
      return niebla;
    },
    estrellas,
    escenaEntorno,
    estado,
    pintar(e) {
      estado.mezcla = e.mezcla;
      estado.noche = e.noche;
      estado.dirSol = { x: e.dirSol.x, y: e.dirSol.y, z: e.dirSol.z };
      const c = coloresCielo(e);
      uniformes.uCenit.value.set(...c.cenit);
      uniformes.uHorizonte.value.set(...c.horizonte);
      uniformes.uHalo.value.set(...c.halo);
      uniformes.uSol.value.set(e.dirSol.x, e.dirSol.y, e.dirSol.z).normalize();
      uniformes.uRadioHalo.value = c.radioHalo;
      uniformes.uBrilloHalo.value = c.brilloHalo;
      uniformes.uBrilloDisco.value = c.brilloDisco;
      // Rebote del regolito: más claro cuanto más alto el Sol; casi nada de noche.
      const luzSuelo = ENTORNO.brilloSuelo * Math.max(0.04, Math.max(0, e.dirSol.y) * 1.6) * (1 - 0.9 * e.noche);
      uniformes.uSuelo.value.set(suelo[0] * luzSuelo, suelo[1] * luzSuelo, suelo[2] * luzSuelo);
      nieblaAltura.color.setRGB(...c.niebla, THREE.LinearSRGBColorSpace);
      nieblaAltura.density = c.densidadNiebla;
      fondo.setRGB(...c.horizonte, THREE.LinearSRGBColorSpace);
      estrellas.visible = e.noche > 0.02;
      estrellas.userData.opacidad = Math.min(1, Math.max(0, (e.noche - 0.3) / 0.6));
    },
    usarNieblaAltura(si) {
      const nueva = si ? nieblaAltura : nieblaLineal;
      if (niebla === nueva) return;
      const activa = escena.fog === niebla;
      niebla = nueva;
      if (activa) escena.fog = niebla;
    },
    aplicarRenderer(renderer, conTono = true) {
      renderer.toneMapping = toneMappingExterior(conTono);
      renderer.toneMappingExposure = conTono ? LUZ.exposicion : 1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    },
    quitar() {
      escena.remove(domo, estrellas, hemisferica, sol, sol.target);
      if (escena.fog === nieblaAltura || escena.fog === nieblaLineal) escena.fog = null;
      if (escena.background === fondo) escena.background = fondoAnterior;
      domo.geometry.dispose();
      (domo.material as THREE.Material).dispose();
      domoEntorno.geometry.dispose();
      (domoEntorno.material as THREE.Material).dispose();
      estrellas.traverse((o) => {
        const p = o as THREE.Points;
        if (!p.isPoints) return;
        p.geometry.dispose();
        const m = p.material as THREE.PointsMaterial;
        m.map?.dispose();
        m.dispose();
      });
      sol.dispose();
    },
  };
  cielo.pintar({ mezcla: ambiente === "atardecer" ? 1 : 0, noche: ambiente === "noche" ? 1 : 0, dirSol: estado.dirSol });
  return cielo;
}
