/** Guion de los capítulos (data/story/cN.json): tipos, validación estricta y carga. */
import c1 from "../../data/story/c1.json";
import c2 from "../../data/story/c2.json";
import type { LineaGuion, RespuestaGuion } from "./adaptador";
import { HABLANTES } from "./hablantes";
import { MISION_JEZERO, MISION_VIAJE_MARTE, type Equipment, type Mision } from "./motor";
import { SALAS, type SalaId } from "./salas";

/** Qué hace el juego cuando el niño toca una respuesta. */
export type Hecho =
  | { tipo: "seguir" }
  | { tipo: "elegir-plan"; opcion: string }
  | { tipo: "aplicar-plan" }
  | { tipo: "aterrizar"; sitio: string }
  | { tipo: "modulo"; modulo: Equipment }
  | { tipo: "reparar"; equipo: Equipment }
  | { tipo: "dilema"; opcion: string }
  | { tipo: "telemetria" }
  | { tipo: "esperar-final" };

export interface Respuesta extends RespuestaGuion { hace: Hecho }

export interface Escena extends LineaGuion {
  id: string;
  /** Paso de la misión en el que ocurre. */
  paso: number;
  sala: SalaId;
  respuestas: Respuesta[];
  /** El tiempo avanza hasta la tormenta antes de mostrarla. */
  antes?: "tormenta";
  /** Solo se muestra si el niño no eligió plan en la intro. */
  si?: "sin-plan";
  /** Fuente del dato real que menciona la línea; se muestra como «dato real, no en vivo». */
  fuente?: string;
}

export interface Capitulo { capitulo: number; mision: Mision; escenas: Escena[] }

const MISIONES: Record<string, Mision> = { [MISION_VIAJE_MARTE.id]: MISION_VIAJE_MARTE, [MISION_JEZERO.id]: MISION_JEZERO };

function falla(donde: string, motivo: string): never {
  throw new Error(`guion ${donde}: ${motivo}`);
}

function comprobarHecho(hace: Hecho, mision: Mision, donde: string): void {
  switch (hace.tipo) {
    case "elegir-plan":
      if (!mision.decisionInicial?.opciones.some((o) => o.id === hace.opcion)) falla(donde, `plan desconocido ${hace.opcion}`);
      return;
    case "dilema":
      if (!mision.dilemaPaso6.opciones.some((o) => o.id === hace.opcion)) falla(donde, `opción desconocida ${hace.opcion}`);
      return;
    case "aterrizar":
      if (!mision.sitiosCandidatos.some((s) => s.id === hace.sitio)) falla(donde, `sitio desconocido ${hace.sitio}`);
      return;
    case "modulo":
      if (!mision.modulosDisponibles.includes(hace.modulo)) falla(donde, `módulo no disponible ${hace.modulo}`);
      return;
    case "reparar":
    case "seguir":
    case "aplicar-plan":
    case "telemetria":
    case "esperar-final":
      return;
    default:
      falla(donde, `acción desconocida ${JSON.stringify(hace)}`);
  }
}

export function validarCapitulo(entrada: { capitulo: number; mision: string; escenas: unknown[] }): Capitulo {
  const mision = MISIONES[entrada.mision] ?? falla(`c${entrada.capitulo}`, `misión desconocida ${entrada.mision}`);
  const escenas = entrada.escenas as Escena[];
  const ids = new Set<string>();
  for (const e of escenas) {
    if (ids.has(e.id)) falla(e.id, "escena repetida");
    ids.add(e.id);
    if (!HABLANTES.includes(e.hablante)) falla(e.id, `hablante desconocido ${e.hablante}`);
    if (!(e.sala in SALAS)) falla(e.id, `sala desconocida ${e.sala}`);
    if (!mision.pasos.some((p) => p.n === e.paso)) falla(e.id, `paso desconocido ${e.paso}`);
    if (e.respuestas.length < 1 || e.respuestas.length > 3) falla(e.id, "de 1 a 3 respuestas");
    for (const r of e.respuestas) comprobarHecho(r.hace, mision, e.id);
  }
  return { capitulo: entrada.capitulo, mision, escenas };
}

export const CAPITULOS: readonly Capitulo[] = [validarCapitulo(c1), validarCapitulo(c2)];
