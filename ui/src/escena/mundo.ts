import type { Equipment, Expert } from "@solar-shield/contracts";
import type { Terreno } from "./fisica.js";
import { puestoDeGuia } from "./guia.js";

/**
 * El único mapa: una base compacta. Coordenadas de juego en metros (Y arriba, la cámara mira hacia −Z).
 * No son coordenadas de Jezero ni medidas de una base real. La escena 3D y la lista accesible de
 * lugares leen esta misma tabla, así nunca dicen cosas distintas.
 */
export type LugarId =
  | "mesa"
  | "habitat"
  | "taller"
  | "sensor"
  | "panel_solar"
  | "reciclador_agua"
  | "escudo"
  | "invernadero"
  | "antena"
  | "banco";

export interface Lugar {
  id: LugarId;
  /** Punto donde se para el jugador para usarlo. */
  x: number;
  z: number;
  /** Distancia a la que aparece la acción. */
  radio: number;
  /** Centro del modelo, para el marcador y para que Iris señale. */
  mx: number;
  mz: number;
  /** Altura del marcador sobre el modelo. */
  my: number;
  /** Tripulante que atiende aquí (se consulta con la API de agentes). */
  experto?: Expert;
  /** Módulo de la misión que se instala en este anclaje. */
  modulo?: Equipment;
}

export const LUGARES: readonly Lugar[] = [
  { id: "mesa", x: 0, z: 1.6, radio: 1.7, mx: 0, mz: 0.2, my: 1.9 },
  { id: "habitat", x: 0, z: -4.3, radio: 2, mx: 0, mz: -8, my: 4.6, experto: "doctora" },
  { id: "taller", x: -4, z: 0.1, radio: 1.8, mx: -4.8, mz: -1.4, my: 1.7, experto: "ingeniera" },
  { id: "sensor", x: 4.2, z: 0.6, radio: 1.8, mx: 4.8, mz: -0.8, my: 3.3, experto: "meteorologa" },
  { id: "panel_solar", x: -8, z: -0.5, radio: 2.4, mx: -8, mz: -3.5, my: 2.9, modulo: "panel_solar" },
  { id: "escudo", x: -4.5, z: -5.3, radio: 1.9, mx: -5.4, mz: -7.2, my: 2.6, modulo: "escudo" },
  { id: "reciclador_agua", x: 4.6, z: -4.2, radio: 2.1, mx: 5.4, mz: -6.8, my: 2.6, modulo: "reciclador_agua" },
  { id: "invernadero", x: 9, z: -0.4, radio: 2.4, mx: 9, mz: -5, my: 4.9, modulo: "invernadero" },
  { id: "antena", x: 9.6, z: 4.4, radio: 1.9, mx: 11, mz: 5.6, my: 4.4, modulo: "antena" },
  { id: "banco", x: -4.6, z: 4.4, radio: 2.2, mx: -7.7, mz: 6.7, my: 2.2 },
];

export function lugar(id: LugarId): Lugar {
  const l = LUGARES.find((x) => x.id === id);
  if (!l) throw new Error(`lugar desconocido: ${id}`);
  return l;
}

export function lugarDelModulo(m: Equipment): Lugar | undefined {
  return LUGARES.find((l) => l.modulo === m);
}

export type ModuloJezero = Extract<Equipment,
  "panel_solar" | "reciclador_agua" | "escudo" | "invernadero" | "antena">;
export type ExpertaBase = Extract<Expert, "ingeniera" | "doctora" | "meteorologa">;

/** Metros de juego; Y es el suelo, no la altura del marcador `my`. */
export interface Anclaje {
  readonly id: string;
  readonly lugarId: LugarId;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Los cinco soportes existen incluso cuando el módulo está ausente (VistaEscena). */
export const ANCLAJES_MODULOS: Readonly<Record<ModuloJezero, Anclaje>> = {
  panel_solar: anclajeModulo("panel_solar"),
  reciclador_agua: anclajeModulo("reciclador_agua"),
  escudo: anclajeModulo("escudo"),
  invernadero: anclajeModulo("invernadero"),
  antena: anclajeModulo("antena"),
};

function anclajeModulo(id: ModuloJezero): Anclaje {
  const l = lugar(id);
  return { id: `modulo:${id}`, lugarId: id, x: l.mx, y: 0, z: l.mz };
}

/** Puestos de encuentro de ESCENAS §3.2, separados del centro de los edificios. */
export const ANCLAJES_EXPERTAS: Readonly<Record<ExpertaBase, Anclaje>> = {
  ingeniera: anclajeExperta("ingeniera", "taller"),
  doctora: anclajeExperta("doctora", "habitat"),
  meteorologa: anclajeExperta("meteorologa", "sensor"),
};

function anclajeExperta(id: ExpertaBase, lugarId: LugarId): Anclaje {
  const l = lugar(lugarId);
  return { id: `experta:${id}`, lugarId, x: l.x, y: 0, z: l.z };
}

/** Mismo puesto lateral que usa la guía de Paula; no añade coordenadas a mano. */
export const DOCK_IRIS: Anclaje = {
  id: "iris:dock", lugarId: "taller", y: 0, ...puestoDeGuia(lugar("taller")),
};

/** Banco de pruebas: rampa ancha que sube a una plataforma baja. */
export const BANCO = { x0: -9, x1: -6.4, zBajo: 2.4, zAlto: 5.4, zFondo: 8, alto: 0.6 } as const;

export const TERRENO: Terreno = {
  limite: 20,
  circulos: [
    { x: 0, z: 0.2, r: 0.85 }, // mesa de misión
    { x: -4.8, z: -1.4, r: 0.7 }, // taller
    { x: 4.8, z: -0.8, r: 0.45 }, // sensor de radiación
    { x: 9, z: -5, r: 3.85 }, // invernadero
    { x: 11, z: 5.6, r: 0.8 }, // antena
    { x: 5.4, z: -6.8, r: 1.15 }, // reciclador
    { x: -5.4, z: -6.4, r: 0.75 }, // escudo (tramo 1)
    { x: -5.4, z: -7.6, r: 0.75 }, // escudo (tramo 2)
    { x: -5.4, z: -8.8, r: 0.75 }, // escudo (tramo 3)
    ...[0, 1].flatMap((f) => [0, 1, 2].map((c) => ({ x: -8 + c * 2.15 - 2.15, z: -3.5 + f * 1.9 - 0.95, r: 0.85 }))),
  ],
  capsulas: [{ x0: -3.7, x1: 3.7, z: -8, r: 1.95 }],
  rampas: [{ x0: BANCO.x0, x1: BANCO.x1, zBajo: BANCO.zBajo, zAlto: BANCO.zAlto, alto: BANCO.alto }],
  plataformas: [{ x0: BANCO.x0, x1: BANCO.x1, z0: BANCO.zAlto, z1: BANCO.zFondo, alto: BANCO.alto }],
};

export const INICIO_JUGADOR = { x: 0, z: 3.4 } as const;
export const INICIO_IRIS = { x: 1.3, z: 2.0 } as const;
export const INICIO_CAJA = { x: -4.4, z: 5.2 } as const;
/** Lado de la caja de pruebas, en metros. */
export const LADO_CAJA = 0.5;

/** El lugar utilizable más cercano, o null si ninguno está a su distancia. */
export function lugarCercano(x: number, z: number): LugarId | null {
  let mejor: LugarId | null = null;
  let dMejor = Infinity;
  for (const l of LUGARES) {
    const d = Math.hypot(x - l.x, z - l.z);
    if (d <= l.radio && d < dMejor) {
      mejor = l.id;
      dMejor = d;
    }
  }
  return mejor;
}
