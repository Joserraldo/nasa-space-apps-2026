import type { ClassifierIntent, ClassifierOutput, Equipment, Expert, QuantityWord } from "@solar-shield/contracts";
import { esUrgente, normalizar } from "./normalizar.js";

/** Capa 1 del PLAN §2.3: sin modelo. Si nada coincide, devuelve null y decide el clasificador o un botón. */

type Experto = Expert | "ia_base";

/** Quién responde cada intención. Fijo: lo decide el código, nunca el modelo. */
export const EXPERTO_DE: Record<ClassifierIntent, Experto> = {
  repartir_energia: "ingeniera",
  reparar: "ingeniera",
  estado_energia: "ingeniera",
  estado_salud: "doctora",
  ir_al_refugio: "doctora",
  explicar_dosis: "doctora",
  pronostico: "meteorologa",
  explicar_evento: "meteorologa",
  que_pasa_si: "matematico",
  ayuda: "ia_base",
  repetir: "ia_base",
  saludo: "ia_base",
  fuera_de_tema: "ia_base",
};

/** Confianza fija de un regex: por encima del umbral 0.6, así el experto responde directo. */
export const CONFIANZA_REGEX = 0.9;

const DESTINO = [
  { valor: "blindaje", re: /\b(escudo|blindaje|shield|shields|armor)\b/ },
  { valor: "soporte_vital", re: /\b(oxigeno|aire|agua|comida|oxygen|air|water|food|life support)\b/ },
] as const;

const EQUIPO: { valor: Equipment; re: RegExp }[] = [
  { valor: "ia_base", re: /\b(ia|iris|compu|computadora|robot|ai|computer)\b/ },
  { valor: "panel_solar", re: /\b(panel|paneles|panels?|solar)\b/ },
  { valor: "antena", re: /\b(antena|antenna)\b/ },
  { valor: "bateria", re: /\b(bateria|battery)\b/ },
  { valor: "escudo", re: /\b(escudo|shield)\b/ },
  { valor: "invernadero", re: /\b(invernadero|plantas|greenhouse|plants)\b/ },
  { valor: "reciclador_agua", re: /\b(reciclador|recycler)\b/ },
];

/** Orden importa: la primera regla que coincide gana. */
const REGLAS: { accion: ClassifierIntent; re: RegExp }[] = [
  { accion: "que_pasa_si", re: /\b(que pasa si|y si|que pasaria si|what if|what happens if|what would happen)\b/ },
  { accion: "reparar", re: /\b(arregl\w*|repar\w*|compon\w*|fix\w*|repair\w*)\b/ },
  { accion: "ir_al_refugio", re: /\b(escond\w*|refugio|cueva|corran|hide|shelter|bunker|take cover)\b/ },
  { accion: "explicar_dosis", re: /\b(dosis|radiacion|radiation|dose)\b/ },
  { accion: "estado_salud", re: /\b(estamos bien|como estan|salud|enferm\w*|duele|how are|health|sick|hurts?)\b/ },
  { accion: "explicar_evento", re: /\b(que fue|que era|que es esa|que es ese|what was|what is that)\b/ },
  { accion: "pronostico", re: /\b(tormenta|llamarada|viene|llega|sol|storm|flare|coming|sun)\b/ },
  { accion: "estado_energia", re: /\b(cuanta|cuanto|bateria|energia|how much|battery|power|energy)\b/ },
  { accion: "ayuda", re: /\b(ayuda|no se que|que hago|help|don't know|dont know|what do i do)\b/ },
  { accion: "repetir", re: /\b(otra vez|repite|de nuevo|again|repeat)\b/ },
  { accion: "saludo", re: /\b(hola|buenas|hello|hi|hey)\b/ },
];

const MENCION: { experto: Experto; re: RegExp }[] = [
  { experto: "ingeniera", re: /\b(ingeniera|engineer)\b/ },
  { experto: "doctora", re: /\b(doctora|doctor)\b/ },
  { experto: "meteorologa", re: /\b(meteorologa|meteorologist|weather)\b/ },
  { experto: "matematico", re: /\b(matematico|mathematician)\b/ },
];

function cantidad(texto: string, n: string): QuantityWord {
  if (/\b(poco|poquito|no tanto|little|bit|not too)\b/.test(n)) return "poco";
  if (esUrgente(texto) || /\b(todo|mucho|max|maximo|all|lot|full)\b/.test(n)) return "mucho";
  return "medio";
}

function intencion(texto: string, n: string): { accion: ClassifierIntent; parametros: Record<string, string> } | null {
  // Repartir energía va primero: necesita un destino y un verbo o un "más".
  const destino = DESTINO.find((d) => d.re.test(n));
  const verbo = /\b(sube|subir|pon|ponle|mas|dale|manda|raise|boost|more|put|give|send)\b/.test(n);
  const reparar = REGLAS.find((r) => r.accion === "reparar")!.re.test(n);
  if (destino && verbo && !reparar && !/\b(que pasa si|y si|what if)\b/.test(n)) {
    return { accion: "repartir_energia", parametros: { destino: destino.valor, cantidad: cantidad(texto, n) } };
  }
  const regla = REGLAS.find((r) => r.re.test(n));
  if (!regla) return null;
  if (regla.accion === "reparar") {
    const equipo = EQUIPO.find((e) => e.re.test(n));
    return { accion: "reparar", parametros: equipo ? { equipo: equipo.valor } : {} };
  }
  if (regla.accion === "que_pasa_si") {
    const resto = n.replace(regla.re, " ").trim();
    const interna = resto ? intencion(resto, resto) : null;
    return { accion: "que_pasa_si", parametros: interna && interna.accion !== "que_pasa_si" ? { accion: interna.accion, ...interna.parametros } : {} };
  }
  return { accion: regla.accion, parametros: {} };
}

/** Clasifica sin modelo. null = no se entendió; el llamador prueba el clasificador o muestra botones. */
export function clasificarConAtajos(texto: string): ClassifierOutput | null {
  const n = normalizar(texto);
  if (!n) return null;
  const hallada = intencion(texto, n);
  if (hallada) {
    return { version: "0", experto: EXPERTO_DE[hallada.accion], accion: hallada.accion, parametros: hallada.parametros, confianza: CONFIANZA_REGEX, fuente: "regex" };
  }
  // Nombró a un experto pero no se entendió qué quiere: ese experto pregunta (confianza baja).
  const mencion = MENCION.find((m) => m.re.test(n));
  if (mencion) return { version: "0", experto: mencion.experto, accion: "ayuda", parametros: {}, confianza: 0.5, fuente: "regex" };
  return null;
}
