import type { Action } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import { escenaTormenta, type EscenaTormenta, type MedicionCitada, type OpcionDilemaVista } from "./escenas.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Voces de la misión Luna lado visible, "la noche larga" (propuesta de datos en #100; plan en
 * docs/ideas/voces-misiones-datos.md §3). Depende de que diseño apruebe la misión.
 * Reglas: CRaTER midió en órbita alrededor de la Luna, no en el suelo; Kp 9 es de la Tierra; nada de µGy ni mSv
 * durante la tormenta, solo "veces más". Paso 3 = `consejosAterrizaje` con los sitios Apolo de #125;
 * paso 7 = `avisoControlLuna` de la misión Luna polo sur.
 */

// TODO: de #100 de datos — tormenta de la misión (Gannon; CRaTER ×206 con fondo tranquilo en #95).
export const TORMENTA_LUNA_VISIBLE = "2024-05-10-gannon";

const conFactor = (c?: MedicionCitada): c is MedicionCitada => !!c && c.fondoTranquilo !== false && c.factor >= 1.5;

/** Pasos 5-6, dilema de la batería en plena noche: escudo ahora o calefacción hasta el amanecer. */
export function escenaTormentaLunaVisible(v: VistaAgente, dilema?: readonly OpcionDilemaVista[], crater?: MedicionCitada): EscenaTormenta | null {
  const e = escenaTormenta(v, dilema, crater);
  if (!e) return null;
  const dialogos = e.dialogos.map((d): Dialogo => {
    if (d.experto === "meteorologa") return { ...d, lineas: [...d.lineas, { clave: "agentes.luna_visible.tormenta.noche" }] };
    if (d.experto === "doctora")
      return {
        ...d,
        lineas: [
          conFactor(crater) ? { clave: "agentes.luna_visible.tormenta.doctora", vars: { factor: Math.round(crater.factor) } } : d.lineas[0]!,
          { clave: "agentes.luna_visible.dilema.doctora" },
        ],
      };
    if (d.experto === "ingeniera") return { ...d, lineas: [{ clave: "agentes.luna_visible.dilema.ingeniera" }, ...d.lineas.slice(1)] };
    return d;
  });
  return { ...e, dialogos };
}

export interface EscenaAntena {
  dialogos: Dialogo[];
  opciones: [Action, Action];
}

/** Paso 4b (mala suerte): se avería la antena y la Tierra deja de estar "a un segundo". Avería de juego, sin cifra. */
export function escenaAntena(v: VistaAgente): EscenaAntena | null {
  if (v.equipos.antena !== "averiado") return null;
  const reparar: Action = { tipo: "reparar", equipo: "antena" };
  const seguir: Action = { tipo: "esperar" };
  return {
    dialogos: [
      { experto: "ingeniera", prioridad: "alerta", accion: reparar, lineas: [{ clave: "agentes.luna_visible.antena.alerta" }, { clave: "agentes.luna_visible.antena.reparar" }] },
      { experto: "control_mision", prioridad: "charla", lineas: [{ clave: "agentes.luna_visible.antena.solos" }] },
      { experto: "ia_base", prioridad: "charla", lineas: [{ clave: "agentes.luna_visible.antena.suerte" }] },
    ],
    opciones: [reparar, seguir],
  };
}

/**
 * Paso 8, "una tormenta, tres lugares". La Meteoróloga cita la Tierra (Kp) y Marte (RAD) con la fuente del evento;
 * la Doctora, la órbita lunar con la fuente de CRaTER. Lo que no tenga dato, no se dice.
 */
export function tresLugares(v: VistaAgente, crater?: MedicionCitada): Dialogo[] {
  const t = v.tormenta;
  if (!t) return [];
  const kp = t.fases?.find((f) => f.tipo === "GST" && f.observadoEn === "Tierra" && f.magnitudTexto)?.magnitudTexto;
  const marte = t.medicionMarte;
  const meteorologa: Dialogo = {
    experto: "meteorologa",
    prioridad: "charla",
    fuente: t.fuente,
    lineas: [
      ...(kp ? [{ clave: "agentes.luna_visible.tres.tierra", vars: { kp } }] : []),
      ...(marte
        ? [marte.factor >= 1.5 ? { clave: "agentes.luna_visible.tres.marteSube", vars: { factor: Math.round(marte.factor) } } : { clave: "agentes.luna_visible.tres.marteNada" }]
        : []),
    ],
  };
  const doctora: Dialogo | null = conFactor(crater)
    ? { experto: "doctora", prioridad: "charla", fuente: crater.fuente, lineas: [{ clave: "agentes.luna_visible.tres.luna", vars: { factor: Math.round(crater.factor) } }] }
    : null;
  const iris: Dialogo = { experto: "ia_base", prioridad: "charla", lineas: [{ clave: "agentes.luna_visible.tres.cierre" }] };
  return [...(meteorologa.lineas.length ? [meteorologa] : []), ...(doctora ? [doctora] : []), iris];
}
