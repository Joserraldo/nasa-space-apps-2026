import type { BaseAiLevel, Equipment, GameState } from "@solar-shield/contracts";
import type { DestinoIris } from "@solar-shield/agents";
import { tormentaActiva } from "@solar-shield/engine";
import { misionActiva } from "../juego/misiones.js";

/**
 * Contrato `VistaEscena` (FLUJO §3). Lo define integración (José); lo consumen
 * la escena (Daniel), los personajes (María Paula) y la ubicación (Camilo).
 *
 * Es un derivado puro de `GameState` y del estado de la pantalla: nadie dentro de
 * `escena/` lee `GameState` directo. Si la escena necesita algo más, se agrega aquí
 * con un PR corto avisando a quienes lo consumen.
 */

/** Fases de la partida tal como las recorre la pantalla. */
export type FaseVista = "inicio" | "satelite" | "sitio" | "modulos" | "base" | "tormenta" | "final";

/**
 * Lugar de la base. Hoy es la copia de `LugarId` que usa Iris; cuando entre
 * `LUGARES` en `escena/mundo.ts` (Camilo), este alias pasa a apuntar a su `LugarId`.
 */
export type LugarObjetivo = DestinoIris;

/** Cómo se ve un módulo en la escena. */
export type EstadoModulo = "ausente" | "instalando" | "funcionando" | "averiado";

export interface VistaEscena {
  fase: FaseVista;
  /** Un estado por cada equipo del contrato, siempre con las siete claves. */
  modulos: Record<Equipment, EstadoModulo>;
  iris: {
    nivel: BaseAiLevel;
    /** El equipo de la IA de la base está averiado o destruido: Iris pone cara de error. */
    averiada: boolean;
  };
  tormenta: {
    /** El pronóstico ya la anunció (hay evento en el estado). */
    anunciada: boolean;
    /** Ya está golpeando la base. */
    activa: boolean;
  };
  /** Verdadero si la tripulación activó explícitamente "Subir el escudo" en esta misión. */
  escudoElevado?: boolean;
  /** Adónde conviene ir ahora; null si no hay sugerencia. */
  lugarObjetivo: LugarObjetivo | null;
  resultado: GameState["resultado"];
}

/** Lo que solo sabe la pantalla y no está en `GameState`. */
export interface EntradaVista {
  fase: FaseVista;
  /** Módulos que el niño ya colocó, en orden. */
  colocados: readonly Equipment[];
  /** Módulo que se está instalando ahora (animación en curso), si hay. */
  instalando?: Equipment | null;
  lugarObjetivo?: LugarObjetivo | null;
  /**
   * La avería guionada de Iris (`ia_base` arranca averiada en Jezero) ya se reveló.
   * Mientras sea false, la escena la ve funcionando para no adelantar la sorpresa.
   */
  averiaRevelada?: boolean;
}

export function vistaEscena(estado: GameState, entrada: EntradaVista): VistaEscena {
  const modulos = {} as Record<Equipment, EstadoModulo>;
  for (const equipo of Object.keys(estado.equipos) as Equipment[]) {
    modulos[equipo] = estadoModulo(estado, entrada, equipo);
  }
  return {
    fase: entrada.fase,
    modulos,
    iris: { nivel: estado.iaBase, averiada: modulos.ia_base === "averiado" },
    tormenta: { anunciada: estado.tormenta !== null, activa: tormentaActiva(estado, misionActiva()) },
    escudoElevado:
      estado.causas.some((c) => c.descripcionKey === "causa.subir_escudo" || c.accion?.tipo === "subir_escudo") ||
      estado.efectosPendientes.some((e) => e.descripcionKey === "causa.subir_escudo"),
    lugarObjetivo: entrada.lugarObjetivo ?? null,
    resultado: estado.resultado,
  };
}

function estadoModulo(estado: GameState, entrada: EntradaVista, equipo: Equipment): EstadoModulo {
  if (entrada.instalando === equipo) return "instalando";
  // La IA de la base viene de fábrica; los demás existen solo si el niño los colocó.
  if (equipo !== "ia_base" && !entrada.colocados.includes(equipo)) return "ausente";
  if (equipo === "ia_base" && !entrada.averiaRevelada) return "funcionando";
  return estado.equipos[equipo] === "ok" ? "funcionando" : "averiado";
}
