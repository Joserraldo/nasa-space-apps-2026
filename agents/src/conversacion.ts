import { CLASSIFIER_FALLBACK, CONFIDENCE_THRESHOLD, ClassifierOutputSchema, EquipmentSchema, type Cause, type ClassifierIntent, type ClassifierOutput, type Expert, type GameState } from "@solar-shield/contracts";
import { clasificarConAtajos, EXPERTO_DE } from "./atajos.js";
import { conversar, type OpcionesConversar } from "./conversar.js";
import type { Dialogo, Linea } from "./dialogo.js";

/**
 * Contrato de conversación con la tripulación en el mundo (bloque 0 de PLAN-JUGABILIDAD §2, frentes A y B).
 *
 *   escena: `Interactivo` de tipo `actor` → pantalla: `[E] Talk` → `turno({ via: "acercarse" })`
 *   campo `Ask your crew...` o voz → `pedidoAlModelo` → POST /api/clasificar → `validarClasificacion` → `turno`
 *
 * Reglas (CLAUDE.md):
 * - El modelo solo recibe la frase (`PedidoModelo`): nunca el estado, la memoria ni cifras.
 * - El modelo solo devuelve una clasificación de enums cerrados; el código elige quién responde y qué dice.
 * - Del audio solo cruza la transcripción; el audio se descarta donde se transcribe.
 * - Si el modelo cae o no entiende, la respuesta trae botones (`opciones`): nunca un silencio.
 * - Conversar nunca aplica una `Action`: `dialogo.accion` es una propuesta que el niño confirma.
 */

/** Quién puede responder. `ia_base` es Iris. */
export type Interlocutor = Expert | "ia_base";

/** Copia de `ActorId` de `ui/src/escena/frontera.ts` sin el niño: quien tiene cuerpo en la escena. */
export type ActorConversacion = "ingeniera" | "doctora" | "meteorologa" | "iris";

const ACTOR_DE: Partial<Record<Interlocutor, ActorConversacion>> = { ingeniera: "ingeniera", doctora: "doctora", meteorologa: "meteorologa", ia_base: "iris" };

/** Actor de la escena para `hablando` y `globo`. `null`: habla sin cuerpo (Matemático, Control de misión). */
export function actorDe(quien: Interlocutor): ActorConversacion | null {
  return ACTOR_DE[quien] ?? null;
}

/** Quién responde cuando el niño se acerca a un actor de la escena. */
export function interlocutorDe(actor: ActorConversacion): Interlocutor {
  return actor === "iris" ? "ia_base" : actor;
}

/** Lo que el niño hizo para hablar. `con` es con quién habla (el actor al alcance), si hay alguien. */
export type EntradaConversacion =
  | Readonly<{ via: "acercarse"; con: Interlocutor }>
  | Readonly<{ via: "boton"; con: Interlocutor; pregunta?: ClassifierIntent }>
  | Readonly<{ via: "texto"; texto: string; con?: Interlocutor }>
  | Readonly<{ via: "voz"; transcripcion: string; con?: Interlocutor }>;

/** Igual al límite de `infra/worker/src/clasificar.ts`. */
export const MAX_CARACTERES_PEDIDO = 200;

/** Lo único que sale hacia el modelo. Un campo más aquí es un cambio de contrato. */
export interface PedidoModelo {
  texto: string;
}

function fraseDe(entrada: EntradaConversacion): string | null {
  const frase = entrada.via === "texto" ? entrada.texto : entrada.via === "voz" ? entrada.transcripcion : "";
  const limpia = frase.trim().slice(0, MAX_CARACTERES_PEDIDO);
  return limpia === "" ? null : limpia;
}

/** Cuerpo de POST /api/clasificar. `null`: no hay nada que clasificar (botón, acercarse o frase vacía). */
export function pedidoAlModelo(entrada: EntradaConversacion): PedidoModelo | null {
  const texto = fraseDe(entrada);
  return texto === null ? null : { texto };
}

/** Valores que el modelo puede poner en `parametros`. Todo lo demás se descarta. */
const PARAMETROS: Partial<Record<ClassifierIntent, Record<string, readonly string[]>>> = {
  repartir_energia: { destino: ["blindaje", "soporte_vital"], cantidad: ["poco", "medio", "mucho"] },
  reparar: { equipo: EquipmentSchema.options },
};
const SIMULABLES: readonly ClassifierIntent[] = ["repartir_energia", "reparar", "ir_al_refugio"];

function parametrosCerrados(accion: ClassifierIntent, p: Record<string, string>): Record<string, string> {
  const interna = accion === "que_pasa_si" ? SIMULABLES.find((a) => a === p.accion) : undefined;
  const permitidos = PARAMETROS[interna ?? accion] ?? {};
  const limpio: Record<string, string> = interna ? { accion: interna } : {};
  for (const [clave, valores] of Object.entries(permitidos)) {
    const valor = p[clave];
    if (valor !== undefined && valores.includes(valor)) limpio[clave] = valor;
  }
  return limpio;
}

/**
 * JSON estricto: convierte la respuesta de /api/clasificar (o del modelo) en una clasificación segura.
 * Nunca lanza. Lo que no valida es `CLASSIFIER_FALLBACK` (confianza 0 → botones). El experto lo fija el
 * código (`EXPERTO_DE`) y de `parametros` solo pasan valores de enum: una cifra del modelo no llega al juego.
 */
export function validarClasificacion(json: unknown): ClassifierOutput {
  const p = ClassifierOutputSchema.safeParse(json);
  if (!p.success) return CLASSIFIER_FALLBACK;
  const s = p.data;
  if (s.fuente !== "modelo") return s;
  return { ...s, experto: EXPERTO_DE[s.accion], parametros: parametrosCerrados(s.accion, s.parametros) };
}

/** Algo que el niño decidió y que la tripulación puede nombrar (frente B, tarea B2). Sale de `GameState.causas`. */
export interface Recuerdo {
  tick: number;
  accion: NonNullable<Cause["accion"]>;
}

/** Las decisiones del niño, en orden y una por acción (el motor escribe una causa por recurso). Sin mala suerte ni simulaciones. */
export function recuerdosDe(causas: readonly Cause[]): Recuerdo[] {
  const vistos = new Set<string>();
  const recuerdos: Recuerdo[] = [];
  for (const c of causas) {
    if (c.origen !== "decision" || !c.accion || c.accion.tipo === "simular") continue;
    const llave = `${c.tick}:${JSON.stringify(c.accion)}`;
    if (vistos.has(llave)) continue;
    vistos.add(llave);
    recuerdos.push({ tick: c.tick, accion: c.accion });
  }
  return recuerdos;
}

/**
 * Lo que la conversación recuerda entre turnos. Es JSON plano: la pantalla la guarda junto a la partida y
 * la devuelve en cada turno. No es parte del `GameState` ni la ve el modelo.
 */
export interface MemoriaConversacion {
  turnos: number;
  /** Con quién ya habló el niño, sin repetir (el HUD muestra `Crew` después de la primera conversación). */
  hablados: Interlocutor[];
  /** Última pregunta entendida, para "otra vez". */
  ultima: { con: Interlocutor; pregunta: ClassifierIntent } | null;
  /** Ticks de los recuerdos que cada quien ya comentó, para no repetirse (B2). */
  comentados: Partial<Record<Interlocutor, number[]>>;
}

export const MEMORIA_INICIAL: MemoriaConversacion = { turnos: 0, hablados: [], ultima: null, comentados: {} };

/** Botón de respaldo: tocarlo es otro turno con `entrada`. */
export interface OpcionConversacion {
  etiqueta: Linea;
  entrada: Extract<EntradaConversacion, { via: "boton" }>;
}

/** Preguntas que cada quien ofrece como botón. La primera es la del botón sin pregunta. */
export const PREGUNTAS_DE: Record<Interlocutor, readonly ClassifierIntent[]> = {
  ingeniera: ["estado_energia", "reparar"],
  doctora: ["estado_salud", "explicar_dosis", "ir_al_refugio"],
  meteorologa: ["pronostico", "explicar_evento"],
  matematico: ["que_pasa_si"],
  control_mision: ["ayuda"],
  ia_base: ["ayuda"],
};

export function opcionesDe(con: Interlocutor): OpcionConversacion[] {
  return PREGUNTAS_DE[con].map((pregunta) => ({ etiqueta: { clave: `agentes.conversacion.pregunta.${pregunta}` }, entrada: { via: "boton", con, pregunta } }));
}

export interface RespuestaConversacion {
  habla: Interlocutor;
  /** Para `hablando` y `globo.actor` de la escena. `null`: quien habla no tiene cuerpo. */
  actor: ActorConversacion | null;
  /** Todo lo que dice, para la franja de diálogo. Las cifras de `vars` salen del estado o de data/. */
  dialogo: Dialogo;
  /** Primera línea, para el globo sobre el actor. */
  globo: Linea | null;
  /** Botones para seguir; nunca vacío. */
  opciones: OpcionConversacion[];
  /** `false`: no se entendió y `dialogo` es una aclaración. */
  entendido: boolean;
  origen: ClassifierOutput["fuente"] | "saludo";
  memoria: MemoriaConversacion;
}

export interface OpcionesTurno extends OpcionesConversar {
  /** Respuesta de /api/clasificar ya pasada por `validarClasificacion`. Ausente: sin modelo. */
  clasificacion?: ClassifierOutput;
}

const ACLARA: readonly Interlocutor[] = ["ingeniera", "doctora", "meteorologa", "ia_base"];

function clasificar(entrada: EntradaConversacion, memoria: MemoriaConversacion, o: OpcionesTurno): ClassifierOutput | null {
  if (entrada.via === "acercarse") return null;
  if (entrada.via === "boton") {
    const accion = entrada.pregunta ?? PREGUNTAS_DE[entrada.con][0]!;
    return { version: "0", experto: entrada.pregunta ? EXPERTO_DE[accion] : entrada.con, accion, parametros: {}, confianza: 1, fuente: "boton" };
  }
  const frase = fraseDe(entrada);
  const s = (frase ? clasificarConAtajos(frase) : null) ?? o.clasificacion ?? { ...CLASSIFIER_FALLBACK, fuente: "regex" as const };
  if (s.accion === "repetir" && memoria.ultima) return { ...s, experto: memoria.ultima.con, accion: memoria.ultima.pregunta };
  // No se entendió: aclara quien el niño tiene delante.
  if (s.confianza === 0 && entrada.con && ACLARA.includes(entrada.con)) return { ...s, experto: entrada.con };
  return s;
}

/**
 * Un turno de conversación: puro y sin red. Con la misma entrada, estado y memoria devuelve lo mismo.
 * No aplica acciones ni cambia el `GameState`.
 */
export function turno(entrada: EntradaConversacion, estado: GameState, memoria: MemoriaConversacion, o: OpcionesTurno): RespuestaConversacion {
  const s = clasificar(entrada, memoria, o);
  const dialogo: Dialogo = s
    ? conversar({ clasificacion: s }, estado, o)
    : { experto: (entrada as { con: Interlocutor }).con, prioridad: "charla", lineas: [{ clave: `agentes.conversacion.saludo.${(entrada as { con: Interlocutor }).con}` }] };
  const habla = dialogo.experto;
  // PLAN §2.3: bajo el umbral el personaje pregunta; eso no cuenta como entendido ni se recuerda.
  const entendido = !s || (s.confianza >= CONFIDENCE_THRESHOLD && s.accion !== "fuera_de_tema");
  return {
    habla,
    actor: actorDe(habla),
    dialogo,
    globo: dialogo.lineas[0] ?? null,
    opciones: opcionesDe(habla),
    entendido,
    origen: s ? s.fuente : "saludo",
    memoria: {
      turnos: memoria.turnos + 1,
      hablados: memoria.hablados.includes(habla) ? memoria.hablados : [...memoria.hablados, habla],
      ultima: s && entendido && s.accion !== "saludo" ? { con: s.experto, pregunta: s.accion } : memoria.ultima,
      comentados: memoria.comentados,
    },
  };
}
