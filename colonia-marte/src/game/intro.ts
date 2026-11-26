/**
 * La intro: tomas de cámara (data/shots/intro.json, esquema de src/camera/schema.ts) más lo que pasa
 * en cada una (data/story/intro.json: líneas, música, efecto, fuente y la decisión). Lógica pura.
 */
import tomasJson from "../../data/shots/intro.json";
import guionJson from "../../data/story/intro.json";
import { parseSequence, type Shot, type ShotSequence } from "../camera/schema";
import type { RespuestaGuion } from "./adaptador";
import type { HablanteId } from "./hablantes";

export type Musica = "calma" | "curiosa" | "tension";
export type EfectoIntro = "motor" | "pulso" | "iris" | "clic" | "mapa" | "alerta" | "confirmar";
export type EscenarioId = "space" | "colonia" | "nw-14" | "nw-15" | "nw-16" | "nw-17";

export interface LineaIntro { en: number; hablante: HablanteId | null; linea: string }
export interface TomaIntro {
  id: string;
  musica: Musica;
  efecto: EfectoIntro;
  lineas: LineaIntro[];
  fuente?: { clave: string; aviso: string };
  decision?: RespuestaGuion[];
}
export interface Intro {
  secuencia: ShotSequence;
  tomas: (TomaIntro & { plano: Shot; inicio: number; escenario: EscenarioId })[];
  despues: Record<"refugio" | "escudo" | "cierre", { hablante: HablanteId; linea: string }[]>;
  /** Segundo en el que aparece la decisión. */
  decisionEn: number;
  duracion: number;
}

const ESCENARIOS: readonly EscenarioId[] = ["space", "nw-15", "nw-16", "nw-17"];

export function cargarIntro(tomas: unknown = tomasJson, guion: unknown = guionJson): Intro {
  const secuencia = parseSequence(tomas);
  const { tomas: lista, despues } = guion as { tomas: TomaIntro[]; despues: Intro["despues"] };
  if (lista.length !== secuencia.shots.length) throw new Error("intro: el guion y las tomas no coinciden");
  let inicio = 0;
  const unidas = secuencia.shots.map((plano, i) => {
    const toma = lista[i]!;
    if (toma.id !== plano.id) throw new Error(`intro: se esperaba la toma ${plano.id} y llegó ${toma.id}`);
    if (!ESCENARIOS.includes(plano.zone as EscenarioId)) throw new Error(`intro: escenario desconocido ${plano.zone}`);
    if (toma.lineas.some((l) => l.en < 0 || l.en >= plano.duration)) throw new Error(`intro: línea fuera de la toma ${toma.id}`);
    const unida = { ...toma, plano, inicio, escenario: plano.zone as EscenarioId };
    inicio += plano.duration;
    return unida;
  });
  const decision = unidas.findIndex((t) => t.decision);
  if (decision !== unidas.length - 1) throw new Error("intro: la decisión va en la última toma");
  return { secuencia, tomas: unidas, despues, decisionEn: unidas[decision]!.inicio, duracion: inicio };
}

export interface MomentoIntro {
  toma: Intro["tomas"][number];
  /** La línea que se está diciendo, si ya empezó alguna en esta toma. */
  linea: LineaIntro | null;
  /** La intro espera la respuesta del niño. */
  decidiendo: boolean;
}

export function momento(intro: Intro, segundos: number): MomentoIntro {
  const t = Math.max(0, Math.min(intro.duracion, segundos));
  const toma = [...intro.tomas].reverse().find((x) => t >= x.inicio) ?? intro.tomas[0]!;
  const linea = [...toma.lineas].reverse().find((l) => t - toma.inicio >= l.en) ?? null;
  return { toma, linea, decidiendo: t >= intro.decisionEn };
}
