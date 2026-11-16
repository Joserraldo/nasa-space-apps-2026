/**
 * Cielo y luz de Marte: constantes y funciones puras arriba; `crearCielo` (Three.js) al final.
 *
 * Fuente: docs/referenciapau/MARTE.md §4 (cielo) y §5 (luz). Son propuestas de estilo [E]
 * a calibrar en la cámara del juego; los valores viven aquí para cambiarlos en un solo sitio.
 *
 * Reglas:
 * - Nunca el cielo azul de las láminas `mundo/`: Marte de día es salmón y caramelo (MARTE.md §4).
 * - Una tormenta SOLAR (radiación) no cambia el cielo: la alerta va en la UI y en luces locales
 *   ámbar. Por eso no hay ambiente "tormenta" aquí (MARTE.md §4, fila "Alerta / tormenta solar").
 */

import * as THREE from "three";

export type Ambiente = "dia" | "atardecer";
export type Calidad = "alta" | "baja";
export type Rgb = [number, number, number];

export interface PaletaCielo {
  /** Color en lo alto del cielo. */
  cenit: string;
  /** Color junto al horizonte. */
  horizonte: string;
  /** Halo alrededor del Sol. */
  halo: string;
  /** Color de la niebla de distancia. */
  niebla: string;
}

export const PALETA_CIELO: Readonly<Record<Ambiente, Readonly<PaletaCielo>>> = {
  // MARTE.md §4, fila "Día en Marte" (por defecto).
  dia: {
    cenit: "#D9A38A", // salmón pastel
    horizonte: "#F2CDB0", // caramelo claro
    halo: "#DCE6EC", // halo pequeño junto al Sol
    niebla: "#F2CDB0", // "igual al horizonte"
  },
  // MARTE.md §4, fila "Atardecer exterior".
  atardecer: {
    cenit: "#7A5A80", // ciruela suave
    horizonte: "#E8A27A", // ámbar
    halo: "#8FB6D9", // halo azul más grande (el atardecer azul de Marte, solo junto al Sol)
    // "Ámbar desaturado": #E8A27A mezclado al 50 % con su gris de luminancia (≈ #AEAEAE).
    niebla: "#CBA894",
  },
};

/** Tamaño relativo del halo junto al Sol (MARTE.md §4: pequeño de día, más grande al atardecer). [E] */
export const TAMANO_HALO: Readonly<Record<Ambiente, number>> = { dia: 1, atardecer: 2.5 };

/** Tokens de DISEÑO.md §2.3 que usa la luz. */
export const REGOLITO_MEDIO = "#B76A78";
/** Sombras teñidas de lila, nunca negras (DISEÑO.md §2.3 `sombra-suelo`, §3.3). */
export const SOMBRA_SUELO = "#F8B9B2";
/**
 * Relleno de la hemisférica de día: `lila` (DISEÑO §2.1). Lo que el Sol no toca recibe sobre todo
 * este color, así las sombras del suelo leen lila como en la lámina `mundo/01` y nunca negras
 * (DISEÑO §2.3 `sombra-suelo`, §3.3 "relleno suave frío"). [E] a aprobar por María Paula.
 */
export const LILA_RELLENO = "#EEE5F1";
/** Marfil de referencia para calibrar la exposición (MARTE.md §5). */
export const MARFIL_CALIBRACION = "#F3EEE5";

function normalizar(v: Rgb): Rgb {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
}

/**
 * Parámetros de luz (MARTE.md §5). Convención de ejes de Three: +x derecha, +y arriba,
 * +z hacia la cámara. `direccionSol` apunta DESDE la escena HACIA el Sol (posición de la luz
 * direccional = objetivo + direccionSol * distancia): arriba a la izquierda, casi de lado, apenas
 * al frente y a ~38° de altura, así las sombras caen a la derecha y se ven desde la cámara como en
 * `mundo/01`. Antes ([-0,6, 1, 0,45], ~53°) caían cortas y detrás de cada pieza.
 */
export const LUZ = {
  direccionSol: normalizar([-0.8, 0.65, 0.2]),
  /** Direccional: blanco cálido, más débil y blanco que en la Tierra (DISEÑO.md §3.3). [E] */
  colorSol: "#FFF3E4",
  /** Hemisférica: suelo = `regolito-medio` (MARTE.md §5); cielo de día = `lila` (relleno frío), al atardecer = horizonte. */
  hemisferica: {
    dia: { cielo: LILA_RELLENO, suelo: REGOLITO_MEDIO },
    atardecer: { cielo: PALETA_CIELO.atardecer.horizonte, suelo: REGOLITO_MEDIO },
  } as Readonly<Record<Ambiente, { cielo: string; suelo: string }>>,
  /** `mapSize` de la sombra: <= 1024; 512 en calidad baja (MARTE.md §5). */
  tamanoSombra: { alta: 1024, baja: 512 } as Readonly<Record<Calidad, number>>,
  /**
   * Nombre del tone mapping de Three (`THREE.NoToneMapping`). DISEÑO §3.4 manda sobre MARTE §5:
   * ACES desaturaba y lavaba el regolito (salía salmón pálido); sin tone mapping cada pieza queda
   * del color de su token y el marfil `#F3EEE5` lee marfil con la luz calibrada abajo.
   */
  toneMapping: "No" as const,
  /** Exposición: sin tone mapping Three la ignora; se deja en 1 para que no engañe. */
  exposicion: 1,
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
 * Color del cielo a la altura `t` (0 = horizonte, 1 = cénit) para un ambiente.
 * Convierte los dos extremos de sRGB a lineal e interpola en lineal; devuelve [r, g, b]
 * LINEAL 0–1 (el espacio de trabajo de Three). En t=0 y t=1 da exactamente los extremos.
 */
export function colorCielo(t: number, ambiente: Ambiente = "dia"): Rgb {
  const p = PALETA_CIELO[ambiente];
  const h = hexALineal(p.horizonte);
  const c = hexALineal(p.cenit);
  const k = Math.min(1, Math.max(0, t));
  return [(1 - k) * h[0] + k * c[0], (1 - k) * h[1] + k * c[1], (1 - k) * h[2] + k * c[2]];
}

// ---------------------------------------------------------------------------------------------
// Wrapper Three.js (MARTE.md §4–§5, DISEÑO.md §3.3). Valores [E] a calibrar con la cámara real.
// ---------------------------------------------------------------------------------------------

/** Radio del domo del cielo (u = m). Debe quedar dentro del `far` de la cámara. [E] */
export const RADIO_DOMO = 450;
/**
 * Niebla lineal: deja el claro y el suelo cercano con su color pleno y aclara las capas de la
 * cordillera (radios 215–300: de ~30 % a ~50 % de niebla), perspectiva atmosférica de MARTE §3. [E]
 */
export const NIEBLA = { cerca: 80, lejos: 520 } as const;
/** Radio angular (rad) del halo de día; se multiplica por `TAMANO_HALO`. [E] */
export const RADIO_HALO = 0.2;
/**
 * Intensidades (luces físicas de Three r160, sin tone mapping). En r160 el blanco pleno de un
 * material mate pide irradiancia π: suelo llano al sol ≈ (sol·0,62 + hemi·lila) / π ≈ 0,95 de su
 * token (`regolito-claro` lee naranja saturado) y en sombra ≈ 0,45, teñido de lila (DISEÑO §3.3).
 * Antes: sol 2,8 y hemisférica 0,9 con ACES, que lavaba el suelo. [E] a aprobar por María Paula.
 */
export const INTENSIDAD = { sol: 2.6, hemisferica: 1.55 } as const;
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

export interface Cielo {
  domo: THREE.Mesh;
  sol: THREE.DirectionalLight;
  hemisferica: THREE.HemisphereLight;
  niebla: THREE.Fog;
  /** Sin tone mapping (DISEÑO §3.4), exposición 1 y sombras suaves. */
  aplicarRenderer(renderer: RendererCielo): void;
  /** Quita todo de la escena y libera el domo. */
  quitar(): void;
}

function suave(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const mezclar = (a: Rgb, b: Rgb, k: number): Rgb => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/**
 * Pinta el domo con el gradiente horizonte→cénit y el halo junto al Sol, mezclando el ambiente de día
 * (`k` = 0) con el de atardecer (`k` = 1) en lineal; `dir` es la dirección hacia el Sol (normalizada).
 */
export function pintarDomo(geo: THREE.BufferGeometry, k: number, dir: Readonly<{ x: number; y: number; z: number }>): void {
  const pos = geo.getAttribute("position");
  let atributo = geo.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!atributo) geo.setAttribute("color", (atributo = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3)));
  const colores = atributo.array as Float32Array;
  const halo = mezclar(hexALineal(PALETA_CIELO.dia.halo), hexALineal(PALETA_CIELO.atardecer.halo), k);
  const radioHalo = RADIO_HALO * (TAMANO_HALO.dia + (TAMANO_HALO.atardecer - TAMANO_HALO.dia) * k);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / RADIO_DOMO, y = pos.getY(i) / RADIO_DOMO, z = pos.getZ(i) / RADIO_DOMO;
    // Banda clara ancha junto al horizonte: sqrt abre el gradiente hacia arriba.
    const t = Math.sqrt(Math.max(0, y));
    const base = mezclar(colorCielo(t, "dia"), colorCielo(t, "atardecer"), k);
    const angulo = Math.acos(Math.min(1, Math.max(-1, x * dir.x + y * dir.y + z * dir.z)));
    const w = 1 - suave(0, radioHalo, angulo);
    for (let c = 0; c < 3; c++) colores[i * 3 + c] = (1 - w) * base[c]! + w * halo[c]!;
  }
  atributo.needsUpdate = true;
}

/** Domo en gradiente horizonte→cénit con el halo junto al Sol pintado en color de vértice. */
function crearDomo(ambiente: Ambiente): THREE.Mesh {
  const geo = new THREE.SphereGeometry(RADIO_DOMO, 48, 24);
  const [sx, sy, sz] = LUZ.direccionSol;
  pintarDomo(geo, ambiente === "dia" ? 0 : 1, { x: sx, y: sy, z: sz });
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false });
  const domo = new THREE.Mesh(geo, mat);
  domo.name = "Sky_Dome";
  domo.renderOrder = -1;
  return domo;
}

/**
 * Monta cielo, niebla y luces de Marte en `escena`: 1 direccional cálida arriba a la izquierda
 * con sombras (1024, 512 en baja) + 1 hemisférica (cielo = horizonte, suelo = regolito-medio).
 * Las sombras salen teñidas de lila/caramelo porque la hemisférica rellena lo que el Sol no toca.
 */
export function crearCielo(escena: THREE.Scene, ambiente: Ambiente = "dia", calidad: Calidad = "alta"): Cielo {
  const p = PALETA_CIELO[ambiente];
  const domo = crearDomo(ambiente);
  const niebla = new THREE.Fog(new THREE.Color(p.niebla), NIEBLA.cerca, NIEBLA.lejos);
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
  const fondo = new THREE.Color(p.horizonte);
  escena.background = fondo;
  escena.fog = niebla;
  escena.add(domo, hemisferica, sol, sol.target);

  return {
    domo,
    sol,
    hemisferica,
    niebla,
    aplicarRenderer(renderer) {
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = LUZ.exposicion;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    },
    quitar() {
      escena.remove(domo, hemisferica, sol, sol.target);
      if (escena.fog === niebla) escena.fog = null;
      if (escena.background === fondo) escena.background = fondoAnterior;
      domo.geometry.dispose();
      (domo.material as THREE.Material).dispose();
      sol.dispose();
    },
  };
}
