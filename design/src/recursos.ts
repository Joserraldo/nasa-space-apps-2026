import type { Difficulty, Resource, Resources, Site } from "@solar-shield/contracts";

/**
 * Tablas de balance. Solo datos, nada de lógica (design/CLAUDE.md).
 * BORRADOR del rol motor para desbloquear el motor; el rol diseño ajusta los números.
 * Ninguna cifra aquí es un dato de NASA: son valores de juego (0-100).
 */

export const RECURSO_MAX = 100;

/** Valores iniciales por sitio. Jezero es la ruta dorada. */
export const RECURSOS_INICIALES: Record<Site, Resources> = {
  marte_jezero: { energia: 70, soporte_vital: 80, blindaje: 60 },
  marte_polo_norte: { energia: 55, soporte_vital: 80, blindaje: 65 },
  luna_polo_sur: { energia: 65, soporte_vital: 75, blindaje: 55 },
  luna_lado_visible: { energia: 75, soporte_vital: 75, blindaje: 50 },
  outpost_sorpresa: { energia: 60, soporte_vital: 60, blindaje: 60 },
};

/** Consumo pasivo por tick (siempre negativo o cero): mantener la base cuesta. */
export const CONSUMO_POR_TICK: Record<Site, Resources> = {
  marte_jezero: { energia: -3, soporte_vital: -2, blindaje: -1 },
  marte_polo_norte: { energia: -4, soporte_vital: -2, blindaje: -1 },
  luna_polo_sur: { energia: -3, soporte_vital: -2, blindaje: -2 },
  luna_lado_visible: { energia: -2, soporte_vital: -2, blindaje: -2 },
  outpost_sorpresa: { energia: -3, soporte_vital: -3, blindaje: -2 },
};

export type TipoAccionConCosto =
  | "esperar"
  | "redistribuir_energia"
  | "reparar"
  | "subir_escudo"
  | "refugiarse"
  | "salida_exterior"
  | "ajustar_orbita";

export interface CostoAccion {
  /** Efecto inmediato (el costo). Al menos un recurso baja. */
  inmediato: Partial<Record<Resource, number>>;
  /** Efecto con retraso (el beneficio). Al menos un recurso sube. */
  retrasado: Partial<Record<Resource, number>>;
  /** Clave i18n de la causa que se registra. */
  causaKey: string;
}

/**
 * Costo base de cada acción. Regla de oro: cada acción mueve al menos dos medidores,
 * uno para bien y otro para mal. Ninguna es gratis ni estrictamente mejor.
 */
export const COSTOS_ACCION: Record<TipoAccionConCosto, CostoAccion> = {
  esperar: {
    inmediato: { energia: -2, soporte_vital: -2 },
    retrasado: { blindaje: 2 },
    causaKey: "causa.esperar",
  },
  redistribuir_energia: {
    // La cantidad real la pone el parámetro; aquí el costo fijo de hacerlo.
    inmediato: { energia: -4 },
    retrasado: {},
    causaKey: "causa.redistribuir_energia",
  },
  reparar: {
    inmediato: { energia: -10, soporte_vital: -4 },
    retrasado: { blindaje: 8 },
    causaKey: "causa.reparar",
  },
  subir_escudo: {
    // Se multiplica por el nivel (1-3).
    inmediato: { energia: -8 },
    retrasado: { blindaje: 10 },
    causaKey: "causa.subir_escudo",
  },
  refugiarse: {
    inmediato: { soporte_vital: -6, energia: -3 },
    retrasado: { blindaje: 12 },
    causaKey: "causa.refugiarse",
  },
  salida_exterior: {
    inmediato: { blindaje: -12, soporte_vital: -5 },
    retrasado: { energia: 15 },
    causaKey: "causa.salida_exterior",
  },
  ajustar_orbita: {
    inmediato: { energia: -9 },
    retrasado: { blindaje: 5, soporte_vital: 2 },
    causaKey: "causa.ajustar_orbita",
  },
};

/** Retraso de consecuencias en ticks (PLAN §2.6). */
export const RETRASO_POR_DIFICULTAD: Record<Difficulty, { min: number; max: number; ocultos: boolean }> = {
  facil: { min: 1, max: 1, ocultos: false },
  media: { min: 1, max: 2, ocultos: false },
  dificil: { min: 2, max: 3, ocultos: false },
  hardcore: { min: 2, max: 3, ocultos: true },
};

/** Usos del "¿y si...?" del Matemático; null = ilimitado (PLAN §2.6). */
export const SIMULACIONES_POR_DIFICULTAD: Record<Difficulty, number | null> = {
  facil: null,
  media: 6,
  dificil: 3,
  hardcore: 1,
};

/** Probabilidad por tick de un evento de mala suerte (PLAN §2.5: ~30 % del total). */
export const MALA_SUERTE_POR_DIFICULTAD: Record<Difficulty, number> = {
  facil: 0.05,
  media: 0.1,
  dificil: 0.18,
  hardcore: 0.25,
};

/** Ticks por día de misión y días para ganar (D9 pendiente; borrador). */
export const TICKS_POR_DIA = 6;
export const DIAS_PARA_GANAR = 5;
