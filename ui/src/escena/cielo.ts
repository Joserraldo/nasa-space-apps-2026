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
 * direccional = objetivo + direccionSol * distancia): arriba a la izquierda y algo al frente.
 */
export const LUZ = {
  direccionSol: normalizar([-0.6, 1, 0.45]),
  /** Direccional: blanco cálido, más débil y blanco que en la Tierra (DISEÑO.md §3.3). [E] */
  colorSol: "#FFF3E4",
  /** Hemisférica: suelo = `regolito-medio` (MARTE.md §5); cielo de día = `lila` (relleno frío), al atardecer = horizonte. */
  hemisferica: {
    dia: { cielo: LILA_RELLENO, suelo: REGOLITO_MEDIO },
    atardecer: { cielo: PALETA_CIELO.atardecer.horizonte, suelo: REGOLITO_MEDIO },
  } as Readonly<Record<Ambiente, { cielo: string; suelo: string }>>,
  /** `mapSize` de la sombra: <= 1024; 512 en calidad baja (MARTE.md §5). */
  tamanoSombra: { alta: 1024, baja: 512 } as Readonly<Record<Calidad, number>>,
  /** Nombre del tone mapping de Three (`THREE.ACESFilmicToneMapping`). */
  toneMapping: "ACESFilmic" as const,
  /** Exposición de partida (MARTE.md §5), a calibrar con el marfil `#F3EEE5`. */
  exposicion: 1.06,
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
/** Niebla lineal: empieza cerca de la base y cubre el borde del terreno (lado 400). [E] */
export const NIEBLA = { cerca: 60, lejos: 420 } as const;
/** Radio angular (rad) del halo de día; se multiplica por `TAMANO_HALO`. [E] */
export const RADIO_HALO = 0.2;
/** Intensidades de partida (luces físicas de Three r160). [E] */
export const INTENSIDAD = { sol: 2.2, hemisferica: 1.2 } as const;
/** Media caja de la cámara de sombras alrededor de la base. [E] */
const CAJA_SOMBRA = 40;

/** Lo mínimo del renderer que toca el cielo (así se prueba sin WebGL). */
export type RendererCielo = Pick<THREE.WebGLRenderer, "toneMapping" | "toneMappingExposure" | "shadowMap">;

export interface Cielo {
  domo: THREE.Mesh;
  sol: THREE.DirectionalLight;
  hemisferica: THREE.HemisphereLight;
  niebla: THREE.Fog;
  /** Tone mapping ACES, exposición 1,06 y sombras suaves. */
  aplicarRenderer(renderer: RendererCielo): void;
  /** Quita todo de la escena y libera el domo. */
  quitar(): void;
}

function suave(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Domo en gradiente horizonte→cénit con el halo junto al Sol pintado en color de vértice. */
function crearDomo(ambiente: Ambiente): THREE.Mesh {
  const geo = new THREE.SphereGeometry(RADIO_DOMO, 48, 24);
  const pos = geo.getAttribute("position");
  const colores = new Float32Array(pos.count * 3);
  const halo = hexALineal(PALETA_CIELO[ambiente].halo);
  const radioHalo = RADIO_HALO * TAMANO_HALO[ambiente];
  const [sx, sy, sz] = LUZ.direccionSol;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / RADIO_DOMO, y = pos.getY(i) / RADIO_DOMO, z = pos.getZ(i) / RADIO_DOMO;
    // Banda clara ancha junto al horizonte: sqrt abre el gradiente hacia arriba.
    const base = colorCielo(Math.sqrt(Math.max(0, y)), ambiente);
    const angulo = Math.acos(Math.min(1, Math.max(-1, x * sx + y * sy + z * sz)));
    const w = 1 - suave(0, radioHalo, angulo);
    for (let c = 0; c < 3; c++) colores[i * 3 + c] = (1 - w) * base[c]! + w * halo[c]!;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
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
  sol.position.set(dx * 150, dy * 150, dz * 150);
  sol.castShadow = true;
  const lado = LUZ.tamanoSombra[calidad];
  sol.shadow.mapSize.set(lado, lado);
  const cam = sol.shadow.camera;
  cam.left = -CAJA_SOMBRA; cam.right = CAJA_SOMBRA; cam.top = CAJA_SOMBRA; cam.bottom = -CAJA_SOMBRA;
  cam.near = 1; cam.far = 320;
  sol.shadow.bias = -0.0005;
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
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
