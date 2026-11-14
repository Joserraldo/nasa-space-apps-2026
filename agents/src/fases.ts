import type { GameState } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Fase satélite (pasos 1-2 de la ruta dorada): los mismos 3 expertos, con el "disfraz" de la órbita
 * (Batería = energía, Señal = comunicación con la Tierra, Escudo = blindaje). Cada consejo enseña
 * jugando en 1-2 frases con analogía y lee solo `orbita` del estado.
 */
const BAJO = 30;

export function consejosSatelite(v: VistaAgente & Pick<GameState, "orbita">): Dialogo[] {
  const o = v.orbita;
  if (!o) return [];
  const bateria = Math.round(o.bateriaPct);
  const senal = Math.round(o.senalPct);
  const escudo = Math.round(o.escudoPct);

  const ingeniera: Dialogo = {
    experto: "ingeniera",
    prioridad: bateria < BAJO ? "alerta" : "consejo",
    lineas: [{ clave: bateria < BAJO ? "agentes.satelite.ingeniera.bateriaBaja" : "agentes.satelite.ingeniera.altura", vars: { bateria } }],
  };
  // Con tormenta, el escudo del satélite se gasta; sin tormenta, lo importante es la señal.
  const meteorologa: Dialogo = v.tormenta
    ? { experto: "meteorologa", prioridad: "alerta", fuente: v.tormenta.fuente, lineas: [{ clave: "agentes.satelite.meteorologa.tormenta", vars: { escudo } }] }
    : { experto: "meteorologa", prioridad: "charla", lineas: [{ clave: "agentes.satelite.meteorologa.senal", vars: { senal } }] };
  // En la nave sí hay microgravedad (en la base de Marte no: revisión de datos, #40).
  const doctora: Dialogo = { experto: "doctora", prioridad: "charla", lineas: [{ clave: "agentes.satelite.doctora.microgravedad" }] };

  return [ingeniera, meteorologa, doctora];
}
