/**
 * El flujo del juego: intro → tarjeta de capítulo → escenas → resultado → siguiente capítulo.
 * Funciones puras sobre un estado que se puede guardar. El motor hace todos los cálculos.
 * El tiempo avanza por turnos: cada acción que cuesta algo pasa un turno.
 */
import type { Efecto } from "../audio/efectos";
import type { SettingsState } from "../ui/state/settings";
import type { EstadoJuego } from "./adaptador";
import { misionPara } from "./dificultad";
import { CAPITULOS, type Escena, type Hecho, type Respuesta } from "./historia";
import {
  aplicarAccion, aterrizar, avanzarTick, elegirDilema, elegirPlan, novedades, partidaDeMision,
  type GameState, type Mision,
} from "./motor";
import { NIVEL_BAJO } from "./adaptador";
import type { SalaId } from "./salas";

export type Fase = "intro" | "tarjeta" | "escena" | "resultado" | "terminado";
export type Plan = "refugio" | "escudo";

export interface Juego {
  version: 1;
  fase: Fase;
  /** Índice en CAPITULOS. */
  capitulo: number;
  /** Índice de la escena dentro del capítulo. */
  escena: number;
  plan: Plan | null;
  /** Cada reintento cambia la semilla. */
  intento: number;
  partida: GameState;
}

export interface Paso {
  juego: Juego;
  sonidos: Efecto[];
  /** El motor no permitió la acción: el juego no cambia. */
  rechazada: boolean;
}

/** Tope de turnos al esperar: ninguna misión dura tanto. */
const MAXIMO_ESPERA = 60;

export function misionDe(juego: Juego): Mision {
  return { ...CAPITULOS[juego.capitulo]!.mision, dificultad: juego.partida.dificultad };
}

function partidaNueva(capitulo: number, intento: number, ajustes: SettingsState): GameState {
  const { mision, capitulo: numero } = CAPITULOS[capitulo]!;
  return partidaDeMision(misionPara(mision, ajustes), `colonia-c${numero}-${intento}`);
}

export function nuevoJuego(ajustes: SettingsState): Juego {
  return { version: 1, fase: "intro", capitulo: 0, escena: 0, plan: null, intento: 0, partida: partidaNueva(0, 0, ajustes) };
}

export function decidirEnIntro(juego: Juego, plan: Plan): Juego {
  return { ...juego, plan, fase: "tarjeta" };
}

function esperar(partida: GameState, mision: Mision, hasta: (s: GameState) => boolean): GameState {
  let s = partida;
  for (let i = 0; i < MAXIMO_ESPERA && s.resultado === "en_curso" && !hasta(s); i++) s = avanzarTick(s, mision);
  return s;
}

/** Coloca el juego en la primera escena que corresponde desde `indice`. */
function entrar(juego: Juego, indice: number): Juego {
  const { escenas } = CAPITULOS[juego.capitulo]!;
  const mision = misionDe(juego);
  let i = indice;
  while (i < escenas.length && escenas[i]!.si === "sin-plan" && juego.plan) i++;
  const escena = escenas[i];
  const partida = !escena ? esperar(juego.partida, mision, () => false)
    : escena.antes === "tormenta" ? esperar(juego.partida, mision, (s) => s.tick >= mision.tickTormenta)
    : juego.partida;
  if (partida.resultado !== "en_curso") return { ...juego, partida, fase: "resultado", escena: Math.min(i, escenas.length - 1) };
  return { ...juego, partida, fase: "escena", escena: i };
}

export function empezarCapitulo(juego: Juego): Juego {
  return entrar(juego, 0);
}

/** Aplica lo que dice una respuesta. Devuelve la misma partida si el motor no lo permite. */
function aplicar(juego: Juego, hace: Hecho): { partida: GameState; plan: Plan | null; rechazada: boolean } {
  const mision = misionDe(juego);
  const antes = juego.partida;
  const turno = (s: GameState) => (s === antes ? s : avanzarTick(s, mision));
  const hecho = (partida: GameState, rechazada = partida === antes) => ({ partida, plan: juego.plan, rechazada });
  switch (hace.tipo) {
    case "seguir": return hecho(antes, false);
    case "elegir-plan": return { partida: antes, plan: hace.opcion as Plan, rechazada: false };
    case "aplicar-plan": {
      // Sin energía para el plan, la tormenta llega igual.
      const con = juego.plan ? elegirPlan(antes, juego.plan, mision) : antes;
      return hecho(avanzarTick(con, mision), false);
    }
    case "aterrizar": return hecho(aterrizar(antes, hace.sitio, mision));
    case "modulo": return hecho(turno(aplicarAccion(antes, { tipo: "colocar_modulo", modulo: hace.modulo }, mision)));
    case "reparar": return hecho(turno(aplicarAccion(antes, { tipo: "reparar", equipo: hace.equipo }, mision)));
    case "dilema": return hecho(turno(elegirDilema(antes, hace.opcion, mision)));
    case "telemetria": return hecho(aplicarAccion(antes, { tipo: "enviar_telemetria" }, mision));
    case "esperar-final": return hecho(esperar(antes, mision, () => false), false);
  }
}

/** La escena en pantalla, solo con las respuestas que hoy se pueden cumplir. */
export function escenaActual(juego: Juego): Escena {
  const escena = CAPITULOS[juego.capitulo]!.escenas[juego.escena]!;
  const posibles = escena.respuestas.filter((r) => !aplicar(juego, r.hace).rechazada);
  // Si no alcanza para nada, la historia sigue: el niño nunca se queda sin salida.
  const salida: Respuesta = { id: "sin-recursos", texto: "juego.sinRecursos", icono: "next", hace: { tipo: "seguir" } };
  return { ...escena, respuestas: posibles.length ? posibles : [salida] };
}

function sonidos(antes: GameState, despues: GameState, hace: Hecho, mision: Mision): Efecto[] {
  const lista: Efecto[] = [];
  const propios: Partial<Record<Hecho["tipo"], Efecto>> = {
    aterrizar: "aceptada", modulo: "moduloInstalado", reparar: "moduloOperativo", dilema: "aceptada",
    telemetria: "telemetriaEnviada", "elegir-plan": "confirmar", "aplicar-plan": "confirmar",
  };
  lista.push(propios[hace.tipo] ?? "boton");
  if (antes === despues) return lista;
  const n = novedades(antes, despues, mision);
  if (n.termino === "exito") lista.push("telemetriaRecibida");
  if (n.tormentaLlego) lista.push("alerta");
  const bajos = (s: GameState) => Object.values(s.recursos).filter((v) => v <= NIVEL_BAJO).length;
  if (bajos(despues) > bajos(antes)) lista.push("recursoBajo");
  else if (n.malaSuerte.some((c) => c.descripcionKey !== "causa.tormenta")) lista.push("dano");
  else if (n.efectosLlegaron.length) lista.push("beneficio");
  return lista;
}

export function responder(juego: Juego, respuestaId: string): Paso {
  const nada: Paso = { juego, sonidos: ["rechazada"], rechazada: true };
  if (juego.fase !== "escena") return nada;
  const respuesta = escenaActual(juego).respuestas.find((r) => r.id === respuestaId);
  if (!respuesta) return nada;
  const { partida, plan, rechazada } = aplicar(juego, respuesta.hace);
  if (rechazada) return nada;
  const siguiente: Juego = { ...juego, partida, plan };
  const llego = partida.resultado !== "en_curso" ? { ...siguiente, fase: "resultado" as const } : entrar(siguiente, juego.escena + 1);
  return { juego: llego, sonidos: sonidos(juego.partida, llego.partida, respuesta.hace, misionDe(juego)), rechazada: false };
}

/** Desde el resultado: al capítulo siguiente si se logró; si no, se repite con otra semilla. */
export function continuar(juego: Juego, ajustes: SettingsState): Juego {
  if (juego.fase !== "resultado") return juego;
  const logrado = juego.partida.resultado === "exito";
  const capitulo = logrado ? juego.capitulo + 1 : juego.capitulo;
  if (capitulo >= CAPITULOS.length) return { ...juego, fase: "terminado" };
  const intento = logrado ? 0 : juego.intento + 1;
  return { version: 1, fase: "tarjeta", capitulo, escena: 0, plan: null, intento, partida: partidaNueva(capitulo, intento, ajustes) };
}

/** Lo que el adaptador necesita para pintar el HUD, la pausa y las tarjetas. */
export function vistaDe(juego: Juego): EstadoJuego {
  const { escenas, capitulo } = CAPITULOS[juego.capitulo]!;
  const escena = escenas[juego.escena] ?? escenas.at(-1)!;
  const mision = misionDe(juego);
  const sala: SalaId = escena.sala;
  return { capitulo, mision, partida: juego.partida, paso: juego.fase === "resultado" ? mision.pasos.at(-1)!.n : escena.paso, sala };
}
