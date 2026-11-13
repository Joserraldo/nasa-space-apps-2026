import type { BaseAiLevel, Equipment, Expert } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Iris niveles 1-2 (#59). Todo por reglas del estado, sin modelo.
 * - tutorial: habla primero y dice a quién llamar y por qué.
 * - pistas: solo insinúa el área ("esto huele a energía…"); el niño elige al experto.
 * - offline / danada: no guía (la falla dañada vive en iris.ts).
 */
const BAJO = 30;

type Area = "tormenta" | "energia" | "blindaje" | "soporte" | "calma";

const EXPERTO_DEL_AREA: Record<Area, Expert> = {
  tormenta: "meteorologa",
  energia: "ingeniera",
  blindaje: "ingeniera",
  soporte: "doctora",
  calma: "ingeniera",
};

/** El problema más urgente del estado visible, en orden fijo de prioridad. */
export function areaUrgente(v: VistaAgente): Area {
  if (v.tormenta) return "tormenta";
  const { energia, blindaje, soporte_vital } = v.recursos;
  if (energia < BAJO) return "energia";
  if (blindaje < BAJO) return "blindaje";
  if (soporte_vital < BAJO) return "soporte";
  return "calma";
}

export function guiaIris(v: VistaAgente, nivel: BaseAiLevel): Dialogo | null {
  if (nivel !== "tutorial" && nivel !== "pistas") return null;
  const area = areaUrgente(v);
  if (nivel === "pistas") {
    return { experto: "ia_base", prioridad: "charla", lineas: [{ clave: `agentes.iris.pista.${area}` }] };
  }
  const experto = EXPERTO_DEL_AREA[area];
  return {
    experto: "ia_base",
    prioridad: "consejo",
    lineas: [{ clave: `agentes.iris.tutorial.${area}`, vars: { expertoKey: `agentes.nombre.${experto}` } }],
  };
}

/** Tutorial de cada sistema de la base, en 1-2 frases con analogía. Se muestra al aparecer el sistema. */
export function explicarSistema(equipo: Equipment): Dialogo {
  return { experto: "ia_base", prioridad: "charla", lineas: [{ clave: `agentes.iris.sistema.${equipo}` }] };
}
