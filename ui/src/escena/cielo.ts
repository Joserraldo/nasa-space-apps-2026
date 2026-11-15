/**
 * Cielo y luz de Marte como constantes y funciones puras (sin Three.js).
 *
 * Fuente: docs/referenciapau/MARTE.md §4 (cielo) y §5 (luz). Son propuestas de estilo [E]
 * a calibrar en la cámara del juego; los valores viven aquí para cambiarlos en un solo sitio.
 *
 * Reglas:
 * - Nunca el cielo azul de las láminas `mundo/`: Marte de día es salmón y caramelo (MARTE.md §4).
 * - Una tormenta SOLAR (radiación) no cambia el cielo: la alerta va en la UI y en luces locales
 *   ámbar. Por eso no hay ambiente "tormenta" aquí (MARTE.md §4, fila "Alerta / tormenta solar").
 */

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
  /** Hemisférica: cielo = horizonte del ambiente, suelo = `regolito-medio` (MARTE.md §5). */
  hemisferica: {
    dia: { cielo: PALETA_CIELO.dia.horizonte, suelo: REGOLITO_MEDIO },
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
