import type { Action, GameState, Resource, Site } from "@solar-shield/contracts";
import {
  MISION_JEZERO,
  MISION_LUNA_POLO_SUR,
  MISION_LUNA_VISIBLE,
  MISION_MARTE_POLO_NORTE,
  MISION_OUTPOST_SORPRESA,
  type AveriaIris,
} from "@solar-shield/missions";
import type { Dialogo } from "./dialogo.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Iris dañada (nivel 3): falla de forma GUIONADA por reglas y semilla, nunca por el modelo.
 * Enseña a verificar antes de obedecer. Toda falla se repara con la Ingeniera
 * (`{ tipo: "reparar", equipo: "ia_base" }`, que el motor ya aplica con repararIa).
 */
export type FormaFalla = "numero_falso" | "silencio" | "experto_equivocado" | "accion_peligrosa";

const ROTACION: readonly FormaFalla[] = ["silencio", "experto_equivocado", "accion_peligrosa", "numero_falso"];

/**
 * Qué falla toca. La primera vez es siempre `numero_falso` (clímax de la ruta dorada, paso 6);
 * después rota según el estado del RNG del motor, así cada semilla falla distinto pero repetible.
 */
export function formaFalla(rngEstado: number, vezNumero: number): FormaFalla {
  if (vezNumero <= 0) return "numero_falso";
  return ROTACION[(rngEstado + vezNumero) % ROTACION.length] as FormaFalla;
}

/** Lo que de verdad pasó, para que el código de verificación y la cadena de causas lo usen. */
export interface Falla {
  forma: FormaFalla;
  recurso?: Resource;
  valorReal?: number;
  valorDicho?: number;
}

export interface DialogoIris extends Dialogo {
  falla: Falla;
}

/**
 * El número falso se aleja siempre lo bastante del medidor para que un niño lo note:
 * si el escudo está bajo, Iris dice que está alto (y al revés). Determinista.
 */
export function numeroFalso(real: number): number {
  const r = Math.round(real);
  return r < 50 ? Math.min(100, r + 45) : Math.max(0, r - 45);
}

/** Avería guionada de la misión del sitio jugado; si el sitio no es de ninguna, la de Jezero. */
export function averiaDeSitio(sitio: Site): AveriaIris {
  const misiones = [MISION_JEZERO, MISION_MARTE_POLO_NORTE, MISION_LUNA_POLO_SUR, MISION_LUNA_VISIBLE, MISION_OUTPOST_SORPRESA];
  return misiones.find((m) => m.sitio === sitio)?.averiaIris ?? MISION_JEZERO.averiaIris;
}

/**
 * Lectura falsa determinista: Iris exagera el valor hacia arriba y, si no cabe en 100,
 * se queda corta. Así el número siempre se aleja del medidor lo suficiente para notarlo.
 */
export function lecturaFalsa(real: number, error: number): number {
  const r = Math.round(real);
  return r + error <= 100 ? r + error : Math.max(0, r - error);
}

/** Lo que Iris dice de un recurso: falsa con la IA dañada, redondeada y cierta si está sana. */
export function lecturaIris(v: VistaAgente, averia: AveriaIris): { recurso: Resource; valor: number; falsa: boolean } {
  if (v.iaBase === "danada") {
    return { recurso: averia.recursoMalLeido, valor: lecturaFalsa(v.recursos[averia.recursoMalLeido], averia.errorLectura), falsa: true };
  }
  return { recurso: averia.recursoMalLeido, valor: Math.round(v.recursos[averia.recursoMalLeido]), falsa: false };
}

export function irisDanada(v: VistaAgente & Pick<GameState, "rngEstado">, vezNumero = 0, averia?: AveriaIris): DialogoIris {
  const forma = formaFalla(v.rngEstado, vezNumero);
  const base = { experto: "ia_base" as const, prioridad: "consejo" as const };
  const glitch = { clave: "agentes.iris.falla.glitch" };
  switch (forma) {
    case "numero_falso": {
      const recurso = averia ? averia.recursoMalLeido : "blindaje";
      const valorReal = Math.round(v.recursos[recurso]);
      const valorDicho = averia ? lecturaFalsa(valorReal, averia.errorLectura) : numeroFalso(valorReal);
      return {
        ...base,
        falla: { forma, recurso, valorReal, valorDicho },
        lineas: [
          glitch,
          { clave: recurso === "blindaje" ? "agentes.iris.falla.numero" : `agentes.iris.falla.numero.${recurso}`, vars: { valor: valorDicho } },
          { clave: recurso === "blindaje" ? "agentes.iris.falla.numeroConsejo" : `agentes.iris.falla.numeroConsejo.${recurso}` },
        ],
      };
    }
    case "silencio":
      return { ...base, prioridad: "charla", falla: { forma }, lineas: [glitch, { clave: "agentes.iris.falla.silencio" }] };
    case "experto_equivocado": {
      // Con tormenta debería mandar a la Meteoróloga o a la Doctora; manda a quien no toca.
      const equivocado = v.tormenta ? "matematico" : "meteorologa";
      return { ...base, falla: { forma }, lineas: [glitch, { clave: "agentes.iris.falla.experto", vars: { expertoKey: `agentes.nombre.${equivocado}` } }] };
    }
    case "accion_peligrosa": {
      // Suena razonable ("salvar las plantas"), pero deja la base sin escudo en plena tormenta.
      const accion: Action = { tipo: "redistribuir_energia", hacia: "soporte_vital", cantidad: 50 };
      return { ...base, accion, falla: { forma }, lineas: [glitch, { clave: "agentes.iris.falla.peligrosa" }] };
    }
  }
}

/**
 * La Ingeniera verifica contra el medidor real y propone reparar a Iris.
 * Si hubo número falso, nombra los dos valores para que el niño vea la diferencia.
 */
export function verificarIris(falla: Falla, v: VistaAgente, averia?: AveriaIris): Dialogo {
  const reparar: Action = { tipo: "reparar", equipo: "ia_base" };
  const { forma, recurso, valorDicho } = falla;
  let lineas: Dialogo["lineas"];
  if (forma === "numero_falso" && valorDicho !== undefined) {
    const real = Math.round(averia && recurso ? v.recursos[recurso] : v.recursos.blindaje);
    const clave = averia && recurso !== undefined && recurso !== "blindaje" ? `agentes.iris.verificar.numero.${recurso}` : "agentes.iris.verificar.numero";
    lineas = [{ clave, vars: { dicho: valorDicho, real } }];
  } else {
    lineas = [{ clave: `agentes.iris.verificar.${forma}` }];
  }
  return {
    experto: averia ? averia.reparaCon : "ingeniera",
    prioridad: "consejo",
    accion: reparar,
    lineas: [...lineas, { clave: "agentes.iris.verificar.reparar" }],
  };
}
