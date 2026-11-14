import type { Action, GameState, Resource } from "@solar-shield/contracts";
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

export function irisDanada(v: VistaAgente & Pick<GameState, "rngEstado">, vezNumero = 0): DialogoIris {
  const forma = formaFalla(v.rngEstado, vezNumero);
  const base = { experto: "ia_base" as const, prioridad: "consejo" as const };
  const glitch = { clave: "agentes.iris.falla.glitch" };
  switch (forma) {
    case "numero_falso": {
      const valorReal = Math.round(v.recursos.blindaje);
      const valorDicho = numeroFalso(valorReal);
      return {
        ...base,
        falla: { forma, recurso: "blindaje", valorReal, valorDicho },
        lineas: [glitch, { clave: "agentes.iris.falla.numero", vars: { valor: valorDicho } }, { clave: "agentes.iris.falla.numeroConsejo" }],
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
export function verificarIris(falla: Falla, v: VistaAgente): Dialogo {
  const reparar: Action = { tipo: "reparar", equipo: "ia_base" };
  const lineas =
    falla.forma === "numero_falso" && falla.valorDicho !== undefined
      ? [{ clave: "agentes.iris.verificar.numero", vars: { dicho: falla.valorDicho, real: Math.round(v.recursos.blindaje) } }]
      : [{ clave: `agentes.iris.verificar.${falla.forma}` }];
  return { experto: "ingeniera", prioridad: "consejo", accion: reparar, lineas: [...lineas, { clave: "agentes.iris.verificar.reparar" }] };
}
