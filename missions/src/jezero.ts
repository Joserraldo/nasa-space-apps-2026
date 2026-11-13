import type { Difficulty, Equipment, MissionGoal, Site } from "@solar-shield/contracts";

/**
 * Misión de la ruta dorada: cráter Jezero, Marte. Solo datos; la lógica vive en engine/.
 * Es la partida de demo del issue #41: 8 pasos en unos 2 minutos.
 */
export interface PasoMision {
  n: number;
  /** Clave i18n del título del paso. */
  tituloKey: string;
  /** Qué debe pasar para avanzar. */
  meta: "satelite_suelto" | "ruta_dibujada" | "sitio_elegido" | "modulos_colocados" | "tormenta_llega" | "consejo_opuesto" | "telemetria_enviada" | "fin";
}

export interface Mision {
  id: string;
  nombreKey: string;
  sitio: Site;
  objetivo: MissionGoal;
  dificultad: Difficulty;
  /** Id del evento curado en data/curated/. */
  tormentaId: string;
  /** Equipo que arranca averiado (Iris dañada en el paso 6). */
  averiaInicial: Equipment;
  /** Módulos que el jugador coloca en el paso 4 (elige 2 de estos). */
  modulosDisponibles: Equipment[];
  modulosAColocar: number;
  /** Tick en el que la tormenta se activa (la pausa automática la hace ui). */
  tickTormenta: number;
  pasos: PasoMision[];
}

export const MISION_JEZERO: Mision = {
  id: "jezero-dorada",
  nombreKey: "mision.jezero.nombre",
  sitio: "marte_jezero",
  objetivo: "explorar",
  dificultad: "media",
  tormentaId: "2024-05-20-marte",
  averiaInicial: "ia_base",
  modulosDisponibles: ["panel_solar", "reciclador_agua", "escudo", "invernadero", "antena"],
  modulosAColocar: 2,
  tickTormenta: 3,
  pasos: [
    { n: 1, tituloKey: "mision.jezero.paso1", meta: "satelite_suelto" },
    { n: 2, tituloKey: "mision.jezero.paso2", meta: "ruta_dibujada" },
    { n: 3, tituloKey: "mision.jezero.paso3", meta: "sitio_elegido" },
    { n: 4, tituloKey: "mision.jezero.paso4", meta: "modulos_colocados" },
    { n: 5, tituloKey: "mision.jezero.paso5", meta: "tormenta_llega" },
    { n: 6, tituloKey: "mision.jezero.paso6", meta: "consejo_opuesto" },
    { n: 7, tituloKey: "mision.jezero.paso7", meta: "telemetria_enviada" },
    { n: 8, tituloKey: "mision.jezero.paso8", meta: "fin" },
  ],
};
