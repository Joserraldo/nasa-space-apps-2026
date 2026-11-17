/**
 * Suelo usado de la base, dibujado en el suelo (Etapa BC): senderos de polvo compactado con borde
 * irregular, zonas de trabajo pisoteadas, huellas de botas y de rover y suelo removido junto a módulos y
 * a la esclusa del hábitat. Sin losas ni juntas. Dos texturas de datos que el shader del terreno
 * (`sueloMarte.ts`) lee en planta:
 *
 * `texturaCaminos` (senderos):
 * - R: distancia con signo al borde del sendero o zona más cercana (0,5 = borde; menos = adentro), ±`rango` m.
 * - G: posición transversal en ese sendero (0 y 1 = bordes, 0,5 = eje).
 * - B: cuánto se compacta.
 *
 * `texturaUso` (rover y suelo removido):
 * - R: posición transversal en la ruta del rover (0,5 = eje; las ruedas a ±`ROVER.trocha / 2`).
 * - G: rumbo de la ruta módulo π (las rodadas son simétricas), / π: orienta el dibujo de la rueda.
 * - B: 1 sobre la ruta del rover.
 * - A: suelo removido (1 pegado a un módulo o a la esclusa, 0 a ~2 m).
 *
 * Referencias (regla 11; fotos en `ss-referencias/nasa-fotos/FUENTES.md`):
 * - Huellas de bota y suelo pisoteado: Apolo 11 `as11-40-5878` y `as11-40-5902`.
 * - Huellas de rover: Apolo 15 `as15-86-11603` y `as15-88-11901` (dos rodadas paralelas con dibujo).
 * - Suelo removido junto a módulos: `occupy-mars-7` (regolito revuelto y cables al pie del módulo).
 *
 * Los tramos y anchos de los senderos son los de `CAMINOS` (navegación y colisión no cambian).
 */
import * as THREE from "three";
import { CAMINO, CAMINOS, PLAZA, TRONCAL, ANILLO } from "./caminos";
import { distanciaAHuella } from "./baseExterior";
import { huellasModulos } from "./modulosArmados";
import { LUGARES, lugar } from "../mundo";

type P2 = readonly [number, number];

/** Lado del cuadrado cubierto (m, centrado en el origen), resolución y rango de distancia. */
export const CAMPO_CAMINOS = { lado: 48, resolucion: 512, rango: 3 } as const;

/** El sendero pisado es algo más ancho que la losa original: el polvo se abre a los lados. [E] */
const ENSANCHE = 1.15;

/** Zonas de trabajo: disco pisoteado alrededor del punto de uso de cada lugar (m). [E] */
const RADIO_TRABAJO = 1.1;

/**
 * Ruta del rover de la base: el anillo exterior de senderos (el rover chico del kit lo recorre).
 * Trocha y ancho de cada rodada (m), con las proporciones del rover del kit. [E]
 */
export const ROVER = { trocha: 1.1, rodada: 0.22, semiancho: 0.9 } as const;
const RUTA_ROVER: readonly P2[] = ANILLO;

/** Suelo removido: hasta qué distancia (m) de un módulo o de la esclusa. [E] */
const REMOVIDO = { modulo: 1.8, esclusa: 2.8 } as const;

interface Tramo {
  a: P2;
  b: P2;
  semiancho: number;
}

function tramosSenderos(): Tramo[] {
  const salida: Tramo[] = [];
  for (const linea of CAMINOS) {
    const semiancho = ((TRONCAL.includes(linea) ? CAMINO.anchoTroncal : CAMINO.ancho) / 2) * ENSANCHE;
    for (let i = 0; i < linea.length - 1; i++) salida.push({ a: linea[i]!, b: linea[i + 1]!, semiancho });
  }
  return salida;
}

/** Proyección de (x, z) sobre un tramo: distancia, lado (±1) y rumbo del tramo. */
function proyectar(x: number, z: number, a: P2, b: P2): { d: number; lado: number; rumbo: number } {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1e-9;
  const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
  const d = Math.hypot(x - a[0] - dx * u, z - a[1] - dz * u);
  return { d, lado: Math.sign(dx * (z - a[1]) - dz * (x - a[0])) || 1, rumbo: Math.atan2(dz, dx) };
}

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface CamposSuelo {
  caminos: Uint8Array<ArrayBuffer>;
  uso: Uint8Array<ArrayBuffer>;
}

/** Los dos campos RGBA (fila 0 = z mínima), `resolucion`² texeles cada uno. Puro: se prueba sin WebGL. */
export function camposSuelo(resolucion: number = CAMPO_CAMINOS.resolucion, lado: number = CAMPO_CAMINOS.lado): CamposSuelo {
  const caminos = new Uint8Array(resolucion * resolucion * 4);
  const uso = new Uint8Array(resolucion * resolucion * 4);
  const senderos = tramosSenderos();
  const { rango } = CAMPO_CAMINOS;
  const px = PLAZA;
  const modulos = huellasModulos();
  const esclusa = lugar("habitat");
  const hab = lugar("habitat");
  // La esclusa está entre la puerta del hábitat (su centro visual) y el punto de uso.
  const ex = (esclusa.x + hab.mx) / 2, ez = (esclusa.z + hab.mz) / 2;
  const u8 = (v: number) => Math.round(255 * Math.max(0, Math.min(1, v)));
  for (let f = 0; f < resolucion; f++) {
    const z = ((f + 0.5) / resolucion - 0.5) * lado;
    for (let c = 0; c < resolucion; c++) {
      const x = ((c + 0.5) / resolucion - 0.5) * lado;
      // Senderos.
      let mejor = Infinity, lateral = 0.5;
      for (const t of senderos) {
        const p = proyectar(x, z, t.a, t.b);
        const borde = p.d - t.semiancho;
        if (borde < mejor) {
          mejor = borde;
          lateral = 0.5 + (p.lado * Math.min(p.d, t.semiancho)) / (2 * t.semiancho);
        }
      }
      // Plaza de la consola y zonas de trabajo: pisoteadas, sin eje.
      const zonas = [
        Math.hypot(Math.max(px.x0 - x, 0, x - px.x1), Math.max(px.z0 - z, 0, z - px.z1)) - 0.15,
        ...LUGARES.map((l) => Math.hypot(x - l.x, z - l.z) - RADIO_TRABAJO),
      ];
      const dZona = Math.min(...zonas);
      if (dZona < mejor) {
        mejor = dZona;
        lateral = 0;
      }
      const i = (f * resolucion + c) * 4;
      caminos[i] = u8(0.5 + mejor / (2 * rango));
      caminos[i + 1] = u8(lateral);
      caminos[i + 2] = 255;
      caminos[i + 3] = 255;
      // Ruta del rover.
      let dRover = Infinity, latRover = 0.5, rumbo = 0;
      for (let k = 1; k < RUTA_ROVER.length; k++) {
        const p = proyectar(x, z, RUTA_ROVER[k - 1]!, RUTA_ROVER[k]!);
        if (p.d < dRover) {
          dRover = p.d;
          latRover = 0.5 + (p.lado * Math.min(p.d, ROVER.semiancho)) / (2 * ROVER.semiancho);
          rumbo = p.rumbo;
        }
      }
      // Suelo removido junto a los módulos y, más ancho, en la esclusa.
      const dModulo = Math.min(...modulos.map((h) => distanciaAHuella(h, x, z)));
      const removido = Math.max(1 - ss(0.1, REMOVIDO.modulo, dModulo), 1 - ss(0.4, REMOVIDO.esclusa, Math.hypot(x - ex, z - ez)));
      uso[i] = u8(latRover);
      uso[i + 1] = u8((((rumbo % Math.PI) + Math.PI) % Math.PI) / Math.PI);
      uso[i + 2] = dRover < ROVER.semiancho ? 255 : 0;
      uso[i + 3] = u8(removido);
    }
  }
  return { caminos, uso };
}

let texturas: { caminos: THREE.DataTexture; uso: THREE.DataTexture } | null = null;

function texturasSuelo(): { caminos: THREE.DataTexture; uso: THREE.DataTexture } {
  if (texturas) return texturas;
  const n = CAMPO_CAMINOS.resolucion;
  const campos = camposSuelo();
  const crear = (datos: Uint8Array<ArrayBuffer>, nombre: string, filtrar: boolean) => {
    const t = new THREE.DataTexture(datos, n, n, THREE.RGBAFormat);
    t.name = nombre;
    // El rumbo (G del uso) no se promedia bien entre niveles: el campo de uso va sin mipmaps.
    t.magFilter = THREE.LinearFilter;
    t.minFilter = filtrar ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    t.generateMipmaps = filtrar;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
  };
  return (texturas = { caminos: crear(campos.caminos, "Mars_paths_field", true), uso: crear(campos.uso, "Mars_use_field", false) });
}

/** Textura de senderos, plaza y zonas de trabajo (una por página). */
export function texturaCaminos(): THREE.DataTexture {
  return texturasSuelo().caminos;
}

/** Textura de la ruta del rover y del suelo removido (una por página). */
export function texturaUso(): THREE.DataTexture {
  return texturasSuelo().uso;
}
