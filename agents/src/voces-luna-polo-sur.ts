import type { Action, SourceCard } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import { escenaTormenta, type EscenaTormenta, type MedicionCitada, type OpcionDilemaVista } from "./escenas.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Voces de la misión Luna polo sur (propuesta de datos en #98; plan en docs/ideas/voces-misiones-datos.md §3).
 * Depende de que diseño apruebe la misión. Reglas: CRaTER mide EN ÓRBITA, no en la base; sin Kp (la tormenta
 * 2017-09-10-x82 no tiene GST en nuestros datos); el paso 3 reutiliza `consejosAterrizaje` con los sitios de #126.
 */

// TODO: de #98 de datos — tormenta de la misión. CRaTER le da la media diaria más alta de luna.json (#95), con fondo no tranquilo.
export const TORMENTA_LUNA_POLO_SUR = "2017-09-10-x82";

/**
 * Paso 6, dilema del hielo: la expedición al cráter oscuro va a medio camino.
 * @param crater medición de CRaTER armada con `medicionLuna` + `fuenteCrater` (#95). Sin ella, la Doctora no da cifra.
 */
export function escenaTormentaLunaSur(v: VistaAgente, dilema?: readonly OpcionDilemaVista[], crater?: MedicionCitada): EscenaTormenta | null {
  const t = v.tormenta;
  if (!t) return null;
  const e = escenaTormenta(v, dilema, crater);
  if (!e) return null;
  // Lo de Marte va aparte y con su lugar: RAD (Curiosity) midió la misma tormenta allá.
  const marte = t.medicionMarte && t.medicionMarte.factor >= 1.5 ? Math.round(t.medicionMarte.factor) : null;
  const dialogos = e.dialogos.map((d): Dialogo => {
    if (d.experto === "meteorologa")
      return {
        ...d,
        lineas: [
          ...d.lineas,
          { clave: "agentes.luna_sur.tormenta.nube" },
          ...(marte ? [{ clave: "agentes.luna_sur.tormenta.marte", vars: { factor: marte } }] : []),
        ],
      };
    if (d.experto === "doctora")
      return {
        ...d,
        lineas: [
          // Con CRaTER: "uno de los valores más altos de nuestros datos", nunca un factor (fondo no tranquilo).
          crater ? { clave: "agentes.luna_sur.tormenta.doctora" } : { clave: "agentes.escena6.doctora.sinMedida" },
          { clave: "agentes.luna_sur.tormenta.sinAire" },
        ],
      };
    if (d.experto === "ingeniera") return { ...d, lineas: [{ clave: "agentes.luna_sur.dilema.ingeniera" }, ...d.lineas.slice(1)] };
    return d;
  });
  return { ...e, dialogos };
}

export interface EscenaMicrometeorito {
  dialogos: Dialogo[];
  opciones: [Action, Action];
}

/** Paso 4b (mala suerte): una piedrita del espacio avería un panel. Evento de juego: sin cifra de frecuencia. */
export function escenaMicrometeorito(v: VistaAgente): EscenaMicrometeorito | null {
  if (v.equipos.panel_solar !== "averiado") return null;
  const reparar: Action = { tipo: "reparar", equipo: "panel_solar" };
  const aguantar: Action = { tipo: "esperar" };
  return {
    dialogos: [
      {
        experto: "ingeniera",
        prioridad: "alerta",
        accion: reparar,
        lineas: [{ clave: "agentes.luna_sur.micrometeorito.alerta", vars: { energia: Math.round(v.recursos.energia) } }, { clave: "agentes.luna_sur.micrometeorito.reparar" }],
      },
      { experto: "doctora", prioridad: "consejo", accion: aguantar, lineas: [{ clave: "agentes.polvo.doctora.costo" }] },
      { experto: "ia_base", prioridad: "charla", lineas: [{ clave: "agentes.luna_sur.micrometeorito.suerte" }, { clave: "agentes.polvo.elige" }] },
    ],
    opciones: [reparar, aguantar],
  };
}

/** Distancia media Tierra–Luna 384 400 km [V] NSSDC: la luz tarda ≈1,3 s. La frase dice "about one second", sin decimales. */
const FUENTE_DISTANCIA_LUNA: SourceCard = {
  nombreKey: "fuente.nssdc",
  url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  idFuente: "moonfact-distancia",
  consultadoEl: "2026-11-14",
  dueno: "NASA NSSDC",
  estadoDato: "curado",
};

/** Paso 7: Control de Misión contesta casi al instante, pero preguntar sigue costando energía. */
export function avisoControlLuna(): Dialogo {
  const preguntar: Action = { tipo: "enviar_telemetria" };
  return {
    experto: "control_mision",
    prioridad: "consejo",
    fuente: FUENTE_DISTANCIA_LUNA,
    accion: preguntar,
    lineas: [{ clave: "agentes.luna_sur.control.cerca" }, { clave: "agentes.luna_sur.control.costo" }],
  };
}
