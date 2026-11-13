import { ActionSchema, EquipmentSchema, type Action, type ClassifierOutput } from "@solar-shield/contracts";

/**
 * Traduce una intención a una `Action` del motor (mapa 1:1 descrito en contracts/src/action.ts).
 * Las consultas (estado_*, explicar_*, pronostico, ayuda...) no mueven el juego: devuelven null
 * y las responde un experto con plantilla.
 */

/**
 * Cuánta energía es "poco / medio / mucho". PROVISIONAL: el número es de diseño, no de agentes;
 * se mueve a las tablas de design/ cuando motor lo exponga. El modelo nunca produce estas cifras.
 */
export const ENERGIA_POR_CANTIDAD = { poco: 10, medio: 25, mucho: 45 } as const;

function base(accion: string, p: Record<string, string>): Action | null {
  switch (accion) {
    case "repartir_energia": {
      const hacia = p.destino;
      const cantidad = ENERGIA_POR_CANTIDAD[(p.cantidad ?? "medio") as keyof typeof ENERGIA_POR_CANTIDAD];
      if ((hacia !== "blindaje" && hacia !== "soporte_vital") || cantidad === undefined) return null;
      return { tipo: "redistribuir_energia", hacia, cantidad };
    }
    case "reparar": {
      const equipo = EquipmentSchema.safeParse(p.equipo);
      return equipo.success ? { tipo: "reparar", equipo: equipo.data } : null;
    }
    case "ir_al_refugio":
      return { tipo: "refugiarse" };
    default:
      return null;
  }
}

export function aAccion(salida: ClassifierOutput): Action | null {
  let accion: Action | null;
  if (salida.accion === "que_pasa_si") {
    const { accion: interna, ...resto } = salida.parametros;
    const simulada = interna ? base(interna, resto) : null;
    accion = simulada && simulada.tipo !== "simular" ? { tipo: "simular", accion: simulada } : null;
  } else {
    accion = base(salida.accion, salida.parametros);
  }
  // Doble red: lo que sale de aquí siempre valida contra el contrato.
  return accion && ActionSchema.safeParse(accion).success ? accion : null;
}
