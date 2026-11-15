/**
 * Los 5 módulos de la base: qué partes se ven en cada estado (sin Three todavía, issue #180).
 * La forma de cada pieza llega después; aquí solo la regla visual, para que la escena la reconcilie
 * siempre desde `VistaEscena` (APLICACION.md §1 `ModeloModulo`, §8 tiempos; ESCENAS.md §3.2).
 * Ninguna malla toca recursos: el motor manda (MECANICAS.md §5).
 */
import type { Equipment } from "@solar-shield/contracts";
import type { EstadoModulo } from "../vista";

/** Los cinco anclajes que siempre existen en la base (ESCENAS.md §3.2). La batería y la IA no son anclajes. */
export const MODULOS_BASE = ["panel_solar", "reciclador_agua", "escudo", "invernadero", "antena"] as const satisfies readonly Equipment[];
export type ModuloBase = (typeof MODULOS_BASE)[number];

/** Partes de `ModeloModulo` (APLICACION.md §1) que se muestran en cada estado. */
export interface PartesVisibles {
  /** Base del anclaje vacío: siempre visible, también como "propuesta" marcada en el suelo. */
  anclaje: true;
  solido: boolean;
  andamio: boolean;
  /** Piezas animadas (luces, giros): solo cuando funciona. */
  vivos: boolean;
  /** Piezas en reposo del módulo construido. */
  reposo: boolean;
}

export function partesVisibles(estado: EstadoModulo): PartesVisibles {
  switch (estado) {
    case "ausente":
      return { anclaje: true, solido: false, andamio: false, vivos: false, reposo: false };
    case "instalando":
      return { anclaje: true, solido: false, andamio: true, vivos: false, reposo: false };
    case "funcionando":
      return { anclaje: true, solido: true, andamio: false, vivos: true, reposo: true };
    case "averiado":
      // Construido pero apagado: se ve el módulo, sin luces ni giros.
      return { anclaje: true, solido: true, andamio: false, vivos: false, reposo: true };
  }
}

/** Tiempos de transición (APLICACION.md §8): instalando 400 ms; luz o check de operativo 240 ms. */
export const TIEMPOS_MODULO_MS = { instalando: 400, operativo: 240 } as const;

/** Módulos que se ven construidos (sólido o andamio). */
export function construidos(modulos: Readonly<Record<Equipment, EstadoModulo>>): ModuloBase[] {
  return MODULOS_BASE.filter((m) => modulos[m] !== "ausente");
}

/**
 * Regla de la misión: solo los módulos que el jugador construyó se ven construidos, como máximo 2
 * en la ruta dorada (ESCENAS.md §3.2). Devuelve false si la vista pide más de `maximo`: la escena no
 * lo corrige (el motor manda), pero un test o un aviso de desarrollo lo detectan.
 */
export function respetaMaximoConstruidos(modulos: Readonly<Record<Equipment, EstadoModulo>>, maximo = 2): boolean {
  return construidos(modulos).length <= maximo;
}
