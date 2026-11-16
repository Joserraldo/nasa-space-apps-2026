import type { BriefingIris, GuiaLugar } from "@solar-shield/agents";
import type { PedidoEscena } from "../escena/frontera.js";

/** Traduce una clave con variables (la pantalla pasa `traducir` con su idioma). */
export type Traductor = (clave: string, vars?: Record<string, string | number>) => string;

/**
 * La guía de Iris (`guiaIrisLugar` o `briefingIris` de @solar-shield/agents) como pedido a la escena
 * (frontera.ts): adónde marca (`objetivo`), qué hace Iris (`iris`) y su globo (`globo`, ya traducido).
 * Pura. `null` (Iris offline): sin objetivo, sin gesto y sin globo; la escena la deja quieta.
 *
 * El globo es la primera línea del diálogo de Iris: una frase corta sobre el rover. El diálogo completo
 * sigue en el panel de la tripulación. `t` es `traducir` con el idioma: también traduce las variables
 * `*Key` de la línea (`lugarKey`, `expertoKey`).
 */
export function pedidoDeGuia(guia: GuiaLugar | BriefingIris | null, t: Traductor): PedidoEscena {
  if (!guia) return { objetivo: null, iris: null, globo: null };
  const linea = guia.dialogo.lineas[0];
  const globo = linea ? { actor: "iris" as const, texto: t(linea.clave, linea.vars) } : null;
  const iris = { gesto: guia.gesto, cara: guia.cara };
  // El briefing no tiene destino: Iris explica junto al niño.
  if (!("destino" in guia)) return { objetivo: null, iris, globo };
  return { objetivo: { lugar: guia.destino, ruta: guia.ruta }, iris, globo };
}

/** ¿Iris rueda delante del niño hasta el objetivo? Solo cuando señala o pide ayuda (en `pistas` solo mira). */
export function irisGuiaAlObjetivo(pedido: PedidoEscena): boolean {
  const g = pedido.iris?.gesto;
  return !!pedido.objetivo && (g === "senalar" || g === "pedir_reparacion");
}
