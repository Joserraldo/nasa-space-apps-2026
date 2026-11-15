/**
 * Armado de la escena exterior de Jezero, sin renderer ni DOM (así se mide y se prueba sin WebGL).
 *
 * Monta cielo de día, cordillera lejana, terreno con un claro llano en el centro, rocas (pequeñas
 * lejos, grandes en el borde del claro), los cinco anclajes de módulo con su sólido / andamio /
 * vivos, hábitat, torre de control y corredores, consolas y cajas del kit, y la red de caminos
 * adoquinados de los circuitos A y B con balizas instanciadas. La escena solo lee `VistaEscena`: nunca `GameState` ni el motor.
 *
 * Presupuesto (APLICACION §8): las piezas del kit se fusionan por material (`fusionar`) y las
 * repetidas se instancian, así cada familia cuesta 1 llamada por material (+1 de sombra).
 */
import * as THREE from "three";
import { crearCielo, type Calidad, type Cielo } from "./cielo";
import type { Materiales } from "./materiales";
import { liberarEscena } from "./liberar";
import type { VistaEscena } from "./vista";
import { MODULOS_BASE, TIEMPOS_MODULO_MS, type ModuloBase } from "./activos/modulos";
import { DECORADO, armarKit, armarEdificios, distanciaAHuella, huellasBase } from "./activos/baseExterior";
import { huellasModulos } from "./activos/modulosArmados";
import type { Huella } from "./activos/piezasComunes";
import { aplicarEstado, armarAnclajes, armarModulo, type ModuloArmado } from "./activos/modulosArmados";
export { PLAZA, CAMINO, CAMINOS, BALIZAS, geometriaCaminos, posicionesBalizas } from "./activos/caminos";
import { chocaConBase, posicionesBalizas, sobreCamino } from "./activos/caminos";
import { LUGARES } from "./mundo";
export { fusionar } from "./activos/fusionar";
import {
  ESCALA_VERTICAL_POR_DEFECTO,
  PASO_POR_DEFECTO,
  TAMANO_MUNDO_POR_DEFECTO,
  aplanarClaro,
  crearMontanas,
  crearGravilla,
  crearRocas,
  crearTerreno,
  instanciarRocas,
  instanciarRocasAltas,
  leerDem,
  rocasBasalticas,
  submuestrear,
  type OpcionesMalla,
  type Rejilla,
  type TransformacionRoca,
} from "./activos/terreno";

// ---------------------------------------------------------------------------------------------
// Datos del DEM y del claro
// ---------------------------------------------------------------------------------------------

/** Copia de `data/terreno/jezero/jezero.json` (campo `dem`); un test comprueba que coinciden. */
export const DEM_JEZERO = { ancho: 280, alto: 280, metrosPorPixel: 289 } as const;

export const MALLA_JEZERO: OpcionesMalla = {
  metrosPorPixel: DEM_JEZERO.metrosPorPixel * PASO_POR_DEFECTO,
  escalaVertical: ESCALA_VERTICAL_POR_DEFECTO,
  tamañoMundo: TAMANO_MUNDO_POR_DEFECTO,
};

/** Rejilla submuestreada del DEM de Jezero (`elevacion.bin`, Int16LE). */
export function rejillaJezero(buffer: ArrayBuffer): Rejilla {
  const { ancho, alto } = DEM_JEZERO;
  return submuestrear(leerDem(buffer, ancho, alto), ancho, alto, PASO_POR_DEFECTO);
}

/**
 * Claro llano: incluye la base jugable y todo el decorado (`DECORADO`, a menos de 31 m). El terreno se aplana hasta
 * `radio` (con margen de una celda del DEM, ~4,3 u) y sube suave hasta `borde`. [E]
 */
export const CLARO = { radio: 34, borde: 46 } as const;
/** Rocas sueltas fuera del claro. [E] */
export const ROCAS = { n: 40, semilla: 42, radioMin: 24, radio: 110 } as const;
/** Rocas grandes facetadas en el borde del claro (lámina `mundo/01`). [E] */
export const ROCAS_GRANDES = { n: 14, semilla: 9, radioMin: 15, radio: 28, escalaMin: 1.2, escalaMax: 2.6 } as const;

/** Radio en planta de una roca (la roca maestra mide hasta 1,2 u de radio por unidad de escala). */
export function radioRoca(r: TransformacionRoca): number {
  return Math.max(r.escala[0], r.escala[2]) * 1.2;
}

/** Radio en planta máximo de una roca grande (escala máxima con su variación de ±20 %). */
const RADIO_MAX_ROCA_GRANDE = ROCAS_GRANDES.escalaMax * 1.2 * 1.2;

/** Huellas de módulos y base: fijas, se calculan una sola vez (cada intento de roca las consulta). */
let huellasCacheadas: Huella[] | null = null;
function huellasFijasDeBase(): Huella[] {
  return (huellasCacheadas ??= [...huellasModulos(), ...huellasBase()]);
}

/**
 * Las rocas grandes no caen sobre la torre, las cápsulas, sus corredores, el resto del decorado,
 * los módulos ni las piezas del kit (con el radio máximo de una roca grande de margen).
 */
export function rocaGrandeLibre(x: number, z: number): boolean {
  if (DECORADO.some((d) => Math.hypot(x - d.x, z - d.z) < d.radio + 2)) return false;
  if (huellasFijasDeBase().some((h) => distanciaAHuella(h, x, z) < RADIO_MAX_ROCA_GRANDE)) return false;
  return !(z < -10 && Math.abs(x) < 20) && Math.hypot(x, z - 9) > 5;
}

/**
 * Rocas grandes del borde del claro sobre la rejilla ya aplanada (posición en planta fija por
 * semilla). Se descarta la que pisaría a otra ya puesta (con 0,3 m de aire).
 */
export function rocasGrandes(claro: Rejilla): TransformacionRoca[] {
  const hecha = rocasGrandesPorRejilla.get(claro);
  if (hecha) return hecha;
  const g = ROCAS_GRANDES;
  const todas = rocasBasalticas(g.semilla, g.n, claro, MALLA_JEZERO, {
    radioMin: g.radioMin, radio: g.radio, escalaMin: g.escalaMin, escalaMax: g.escalaMax,
    excluir: (x, z) => !rocaGrandeLibre(x, z),
  });
  const puestas: TransformacionRoca[] = [];
  for (const r of todas) {
    const [x, , z] = r.posicion;
    if (puestas.every((p) => Math.hypot(x - p.posicion[0], z - p.posicion[2]) > radioRoca(r) + radioRoca(p) + 0.3)) puestas.push(r);
  }
  rocasGrandesPorRejilla.set(claro, puestas);
  return puestas;
}
/** `rocasGrandes` por rejilla: la escena y `huellasRocas` piden las mismas y no se recalculan. */
const rocasGrandesPorRejilla = new WeakMap<Rejilla, TransformacionRoca[]>();

/**
 * Rocas basálticas grandes de primer plano (`mundo/01`: abajo a la izquierda y a la derecha del
 * encuadre de tercera persona). Puestas a mano para el encuadre por defecto de `CAMARAS.tercera`,
 * fuera de caminos, plaza, banco, sólidos de `TERRENO` y del radio de uso de cada lugar
 * (`rocaPrimerPlanoLibre`). En el borde del círculo caminable: PENDIENTE que Camilo las sume como
 * círculos de colisión en `TERRENO` (mundo.ts) con `radioRocaPrimerPlano`. [E]
 */
export const ROCAS_PRIMER_PLANO: readonly TransformacionRoca[] = [
  { posicion: [-6.5, 0, 1.5], escala: [0.75, 1.5, 0.7], rotacion: [0.02, 0.6, -0.03] }, // grande y alta, esquina inferior izquierda
  { posicion: [2.4, 0, 3.1], escala: [0.75, 1.7, 0.72], rotacion: [-0.02, 2.1, 0.03] }, // grande y alta, esquina inferior derecha
  { posicion: [-4.2, 0, 2.1], escala: [0.5, 0.7, 0.48], rotacion: [0.05, 0.3, 0] },
  { posicion: [7.2, 0, 3.4], escala: [0.5, 0.6, 0.5], rotacion: [0, 1.4, 0.03] },
];

/** Huella en planta de una roca de primer plano. */
export const radioRocaPrimerPlano = radioRoca;

/** Huellas en planta de las rocas de primer plano y de las grandes (sobre la rejilla del claro). */
export function huellasRocas(claro: Rejilla): Huella[] {
  const huella = (prefijo: string) => (r: TransformacionRoca, i: number): Huella =>
    ({ id: `${prefijo}:${i}`, x: r.posicion[0], z: r.posicion[2], r: radioRoca(r) });
  return [...ROCAS_PRIMER_PLANO.map(huella("roca_primer_plano")), ...rocasGrandes(claro).map(huella("roca_grande"))];
}

/** La roca de radio `radio` en (x, z) no pisa caminos, plaza, banco, sólidos, lugares ni decorado. */
export function rocaPrimerPlanoLibre(x: number, z: number, radio: number): boolean {
  if (chocaConBase(x, z, radio) || sobreCamino(x, z, radio)) return false;
  if (LUGARES.some((l) => Math.hypot(x - l.x, z - l.z) < l.radio)) return false;
  if (DECORADO.some((d) => Math.hypot(x - d.x, z - d.z) < d.radio + radio)) return false;
  return !posicionesBalizas().some(([bx, bz]) => Math.hypot(x - bx, z - bz) < radio + 0.3);
}

// ---------------------------------------------------------------------------------------------
// Escena
// ---------------------------------------------------------------------------------------------

export interface EscenaArmada {
  escena: THREE.Scene;
  cielo: Cielo;
  modulos: Readonly<Record<ModuloBase, ModuloArmado>>;
  /** Grupo del terreno y las rocas (vacío hasta `ponerTerreno`). */
  terreno: THREE.Group;
  /** Reconcilia los módulos con la vista (sin reconstruir mallas: solo visibilidad). */
  aplicarVista(vista: VistaEscena): void;
  /** Pone (o reemplaza) el terreno de Jezero con el claro aplanado y las rocas. */
  ponerTerreno(rejilla: Rejilla): void;
  /** Marca un pulso corto en un módulo (evento de avería). */
  pulsar(id: ModuloBase, ahoraMs: number): void;
  /** Avanza animaciones; sin asignaciones. Con `movimientoReducido`: estados finales sin bamboleo. */
  animar(ahoraMs: number, movimientoReducido: boolean): void;
  /** Quita el cielo y libera geometrías propias. Materiales y caché son del dueño (no se tocan). */
  liberar(): void;
}

/**
 * Arma la escena completa. `vista` null = todos los módulos ausentes (solo anclajes).
 * `rejilla` opcional: en el navegador el DEM llega después (`ponerTerreno`); en los tests, ya.
 */
export function armarEscena(
  materiales: Materiales,
  vista: VistaEscena | null,
  rejilla: Rejilla | null = null,
  calidad: Calidad = "alta",
): EscenaArmada {
  const escena = new THREE.Scene();
  escena.name = "Exterior_Jezero";
  const cielo = crearCielo(escena, "dia", calidad);
  const terreno = new THREE.Group();
  terreno.name = "Terrain_Group";
  const base = new THREE.Group();
  base.name = "Base";
  const modulos = Object.fromEntries(MODULOS_BASE.map((id) => [id, armarModulo(materiales, id)])) as Record<ModuloBase, ModuloArmado>;
  // Las rocas de primer plano están dentro del claro llano (y = 0): no esperan al DEM.
  const primerPlano = instanciarRocasAltas(materiales, ROCAS_PRIMER_PLANO, "Rocks_Basalt_Foreground");
  base.add(armarAnclajes(materiales), armarKit(materiales), armarEdificios(materiales), primerPlano, ...MODULOS_BASE.map((id) => modulos[id].raiz));
  escena.add(terreno, base, crearMontanas(materiales));

  const armada: EscenaArmada = {
    escena,
    cielo,
    modulos,
    terreno,
    aplicarVista(v) {
      for (const id of MODULOS_BASE) aplicarEstado(modulos[id], v.modulos[id]);
    },
    ponerTerreno(r) {
      for (const hijo of [...terreno.children]) {
        terreno.remove(hijo);
        liberarEscena(hijo);
      }
      const claro = aplanarClaro(r, MALLA_JEZERO, CLARO.radio, CLARO.borde);
      const t = crearTerreno(materiales, { rejilla: claro.rejilla, malla: MALLA_JEZERO });
      const rocas = crearRocas(materiales, t, ROCAS.n, ROCAS.semilla, { radioMin: ROCAS.radioMin, radio: ROCAS.radio });
      const grandes = instanciarRocas(materiales, rocasGrandes(claro.rejilla), "Rocks_Basalt_Large");
      const ocupado = [...huellasFijasDeBase(), ...huellasRocas(claro.rejilla)];
      const gravilla = crearGravilla(materiales, t, {
        excluir: (x, z) => chocaConBase(x, z, 0.3) || sobreCamino(x, z, 0.2) || ocupado.some((h) => distanciaAHuella(h, x, z) < 0.3),
      });
      terreno.add(t.malla, rocas, grandes, gravilla);
      terreno.position.y = -claro.altura;
    },
    pulsar(id, ahora) {
      modulos[id].pulso = ahora;
    },
    animar(ahora, reducido) {
      for (const id of MODULOS_BASE) {
        const mod = modulos[id];
        if (mod.inicio < 0) mod.inicio = ahora;
        const dt = ahora - mod.inicio;
        // Instalando: el andamio crece en 400 ms. Operativo: la luz aparece en 240 ms.
        const kA = reducido ? 1 : Math.min(1, dt / TIEMPOS_MODULO_MS.instalando);
        mod.andamio.scale.set(1, Math.max(0.001, kA), 1);
        const kV = reducido ? 1 : Math.min(1, dt / TIEMPOS_MODULO_MS.operativo);
        const bamboleo = reducido ? 1 : 1 + 0.15 * Math.sin(ahora / 320);
        mod.vivos.scale.setScalar(Math.max(0.001, kV * bamboleo));
        // Pulso de avería: un leve latido de 400 ms (nunca sacudidas, APLICACION §7).
        const dp = ahora - mod.pulso;
        const latido = !reducido && dp >= 0 && dp < 400 ? 1 + 0.05 * Math.sin((dp / 400) * Math.PI) : 1;
        mod.raiz.scale.setScalar(latido);
      }
    },
    liberar() {
      cielo.quitar();
      liberarEscena(escena);
    },
  };
  if (vista) armada.aplicarVista(vista);
  if (rejilla) armada.ponerTerreno(rejilla);
  return armada;
}
