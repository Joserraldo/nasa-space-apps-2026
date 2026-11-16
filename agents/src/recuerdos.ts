import type { Equipment, GameState } from "@solar-shield/contracts";
import { recuerdosDe, type Interlocutor, type MemoriaConversacion, type Recuerdo } from "./conversacion.js";
import type { Linea } from "./dialogo.js";

/**
 * La tripulación recuerda y reacciona (frente B, tarea B2 de PLAN-JUGABILIDAD §4).
 *
 * Cada experta comenta, con su personalidad (HISTORIA §2), las decisiones del niño que le importan:
 * la Ingeniera energía, escudo y reparaciones; la Doctora refugio y soporte vital; la Meteoróloga
 * tormenta, antena y telemetría. Todo sale de `GameState.causas`: sin modelo y sin cifras inventadas
 * (los únicos números son parámetros de la acción que el niño eligió).
 */

/** Quien comenta recuerdos. El resto (Iris, Matemático, Control de misión) no comenta. */
export type Comentarista = "ingeniera" | "doctora" | "meteorologa";

/** Lo único del estado que mira esta función. */
export type VistaRecuerdos = Pick<GameState, "causas">;

export interface ComentarioRecuerdo {
  linea: Linea;
  recuerdo: Recuerdo;
  /** La memoria con este recuerdo anotado en `comentados[quien]`. */
  memoria: MemoriaConversacion;
}

type Accion = Recuerdo["accion"];
type Regla = (accion: Accion) => Linea | null;

const equipoKey = (e: Equipment) => `agentes.equipo.${e}`;
const linea = (quien: Comentarista, sufijo: string, vars?: Linea["vars"]): Linea => (vars ? { clave: `agentes.recuerdo.${quien}.${sufijo}`, vars } : { clave: `agentes.recuerdo.${quien}.${sufijo}` });

/** Módulos de los que cada experta tiene algo propio que decir al construirlos. */
const MODULOS_DE: Record<Comentarista, readonly Equipment[]> = {
  ingeniera: ["panel_solar", "bateria", "escudo", "ia_base"],
  doctora: ["reciclador_agua", "invernadero", "escudo"],
  meteorologa: ["antena"],
};
/** Equipos cuya reparación comenta cada experta. La Ingeniera, todos: reparar es lo suyo. */
const REPARA_DE: Record<Exclude<Comentarista, "ingeniera">, readonly Equipment[]> = {
  doctora: ["reciclador_agua", "invernadero"],
  meteorologa: ["antena"],
};

function modulo(quien: Comentarista, a: Accion): Linea | null {
  return a.tipo === "colocar_modulo" && MODULOS_DE[quien].includes(a.modulo) ? linea(quien, `modulo.${a.modulo}`, { equipoKey: equipoKey(a.modulo) }) : null;
}

const REGLAS: Record<Comentarista, Regla> = {
  ingeniera: (a) => {
    switch (a.tipo) {
      case "colocar_modulo":
        return modulo("ingeniera", a);
      case "subir_escudo":
        return linea("ingeniera", "subir_escudo", { nivel: a.nivel });
      case "reparar":
        return linea("ingeniera", "reparar", { equipoKey: equipoKey(a.equipo) });
      case "redistribuir_energia":
        return linea("ingeniera", "redistribuir_energia", { cantidad: a.cantidad, destinoKey: `agentes.recurso.${a.hacia}` });
      case "esperar":
        return linea("ingeniera", "esperar");
      case "salida_exterior":
        return linea("ingeniera", "salida_exterior", { equipoKey: equipoKey(a.objetivo) });
      default:
        return null;
    }
  },
  doctora: (a) => {
    switch (a.tipo) {
      case "colocar_modulo":
        return modulo("doctora", a);
      case "subir_escudo":
        return linea("doctora", "subir_escudo", { nivel: a.nivel });
      case "refugiarse":
        return linea("doctora", "refugiarse");
      case "reparar":
        return REPARA_DE.doctora.includes(a.equipo) ? linea("doctora", "reparar", { equipoKey: equipoKey(a.equipo) }) : null;
      case "redistribuir_energia":
        return a.hacia === "soporte_vital" ? linea("doctora", "redistribuir_energia", { cantidad: a.cantidad, destinoKey: `agentes.recurso.${a.hacia}` }) : null;
      case "salida_exterior":
        return linea("doctora", "salida_exterior", { equipoKey: equipoKey(a.objetivo) });
      default:
        return null;
    }
  },
  meteorologa: (a) => {
    switch (a.tipo) {
      case "colocar_modulo":
        return modulo("meteorologa", a);
      case "subir_escudo":
        return linea("meteorologa", "subir_escudo", { nivel: a.nivel });
      case "refugiarse":
        return linea("meteorologa", "refugiarse");
      case "reparar":
        return REPARA_DE.meteorologa.includes(a.equipo) ? linea("meteorologa", "reparar", { equipoKey: equipoKey(a.equipo) }) : null;
      case "esperar":
        return linea("meteorologa", "esperar");
      case "enviar_telemetria":
        return linea("meteorologa", "enviar_telemetria");
      default:
        return null;
    }
  },
};

export function esComentarista(quien: Interlocutor): quien is Comentarista {
  return quien in REGLAS;
}

/**
 * Lo que `quien` diría de una decisión, o `null` si no tiene nada propio que decir.
 */
export function lineaDeRecuerdo(quien: Comentarista, accion: Accion): Linea | null {
  return REGLAS[quien](accion);
}

/**
 * El recuerdo más reciente que `quien` todavía no comentó, con su línea y la memoria actualizada.
 * `null`: no hay nada nuevo que comentar (o `quien` no comenta). Pura: no cambia estado ni memoria.
 *
 * En `memoria.comentados` cada recuerdo se anota por su posición en `recuerdosDe(estado.causas)`:
 * las causas solo crecen, así que la posición no cambia, y dos decisiones del mismo tick (los dos
 * módulos del paso 4) no se pisan.
 */
export function comentarRecuerdo(quien: Interlocutor, estado: VistaRecuerdos, memoria: MemoriaConversacion): ComentarioRecuerdo | null {
  if (!esComentarista(quien)) return null;
  const recuerdos = recuerdosDe(estado.causas);
  const ya = memoria.comentados[quien] ?? [];
  for (let i = recuerdos.length - 1; i >= 0; i--) {
    if (ya.includes(i)) continue;
    const recuerdo = recuerdos[i]!;
    const l = lineaDeRecuerdo(quien, recuerdo.accion);
    if (l) return { linea: l, recuerdo, memoria: { ...memoria, comentados: { ...memoria.comentados, [quien]: [...ya, i] } } };
  }
  return null;
}

/** Gancho de B0: pasar en opciones.reaccion de turno o conversarConRed. */
export function reaccionTripulacion(quien: Interlocutor, estado: GameState, memoria: MemoriaConversacion): {linea: Linea; comentados: MemoriaConversacion["comentados"]} | null {
  const comentario = comentarRecuerdo(quien, estado, memoria);
  return comentario ? {linea:comentario.linea,comentados:comentario.memoria.comentados} : null;
}
