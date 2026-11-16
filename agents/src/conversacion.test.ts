import { describe, expect, it } from "vitest";
import { ClassifierOutputSchema, type ClassifierIntent } from "@solar-shield/contracts";
import { aplicarAccion, partidaDorada, tormentaActiva } from "@solar-shield/engine";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { MAX_CARACTERES_PEDIDO, MEMORIA_INICIAL, PREGUNTAS_DE, actorDe, interlocutorDe, opcionesDe, pedidoAlModelo, recuerdosDe, turno, validarClasificacion, type Interlocutor } from "./index.js";

const s = partidaDorada();
const o = { tormentaActiva: tormentaActiva(s) };
const QUIENES = Object.keys(PREGUNTAS_DE) as Interlocutor[];

describe("contrato de conversación: lo que ve el modelo", () => {
  it("al modelo solo le llega la frase, recortada: ni estado, ni memoria, ni con quién habla", () => {
    expect(pedidoAlModelo({ via: "texto", texto: "  is a storm coming?  ", con: "meteorologa" })).toEqual({ texto: "is a storm coming?" });
    expect(pedidoAlModelo({ via: "voz", transcripcion: "a".repeat(500) })?.texto).toHaveLength(MAX_CARACTERES_PEDIDO);
  });
  it("botón, acercarse y frase vacía no llaman al modelo", () => {
    expect(pedidoAlModelo({ via: "boton", con: "doctora" })).toBeNull();
    expect(pedidoAlModelo({ via: "acercarse", con: "ingeniera" })).toBeNull();
    expect(pedidoAlModelo({ via: "texto", texto: "   " })).toBeNull();
  });
});

describe("contrato de conversación: JSON estricto del modelo", () => {
  const modelo = (resto: object) => ({ version: "0", confianza: 0.9, fuente: "modelo", parametros: {}, ...resto });
  it("lo que no valida es el respaldo de confianza 0, sin lanzar", () => {
    for (const roto of [null, "hola", 42, {}, modelo({ experto: "ingeniera", accion: "bailar" }), modelo({ experto: "ingeniera", accion: "reparar", confianza: 7 })]) {
      expect(validarClasificacion(roto)).toMatchObject({ accion: "fuera_de_tema", confianza: 0 });
    }
  });
  it("una cifra o un valor fuera del enum en parametros nunca pasa", () => {
    const v = validarClasificacion(modelo({ experto: "ingeniera", accion: "repartir_energia", parametros: { destino: "blindaje", cantidad: "45", energia: "100" } }));
    expect(v.parametros).toEqual({ destino: "blindaje" });
    expect(validarClasificacion(modelo({ experto: "ingeniera", accion: "reparar", parametros: { equipo: "nave" } })).parametros).toEqual({});
    expect(validarClasificacion(modelo({ experto: "doctora", accion: "estado_salud", parametros: { dosis: "3" } })).parametros).toEqual({});
  });
  it("quién responde lo fija el código, no el modelo", () => {
    expect(validarClasificacion(modelo({ experto: "doctora", accion: "reparar", parametros: { equipo: "antena" } }))).toMatchObject({ experto: "ingeniera", parametros: { equipo: "antena" } });
  });
  it("¿y si...? conserva solo una acción simulable y sus parámetros cerrados", () => {
    expect(validarClasificacion(modelo({ experto: "matematico", accion: "que_pasa_si", parametros: { accion: "reparar", equipo: "escudo", cantidad: "9" } })).parametros).toEqual({ accion: "reparar", equipo: "escudo" });
    expect(validarClasificacion(modelo({ experto: "matematico", accion: "que_pasa_si", parametros: { accion: "despegar" } })).parametros).toEqual({});
  });
  it("la salida siempre cumple ClassifierOutput", () => {
    expect(ClassifierOutputSchema.safeParse(validarClasificacion(modelo({ experto: "ia_base", accion: "ayuda" }))).success).toBe(true);
  });
});

describe("contrato de conversación: un turno", () => {
  it("acercarse saluda sin clasificar y deja listo el globo, el actor y los botones", () => {
    const r = turno({ via: "acercarse", con: "ingeniera" }, s, MEMORIA_INICIAL, o);
    expect(r).toMatchObject({ habla: "ingeniera", actor: "ingeniera", origen: "saludo", entendido: true });
    expect(r.globo).toEqual({ clave: "agentes.conversacion.saludo.ingeniera" });
    expect(r.dialogo.accion).toBeUndefined();
    expect(r.opciones.map((x) => x.entrada.pregunta)).toEqual(["estado_energia", "reparar"]);
  });
  it("sin modelo, una frase que nadie entiende vuelve como aclaración de quien está delante, con botones", () => {
    const r = turno({ via: "texto", texto: "cuentame un chiste", con: "doctora" }, s, MEMORIA_INICIAL, o);
    expect(r).toMatchObject({ habla: "doctora", entendido: false, origen: "regex" });
    expect(r.globo?.clave).toBe("agentes.aclarar.doctora");
    expect(r.opciones.length).toBeGreaterThan(0);
    expect(r.memoria.ultima).toBeNull();
  });
  it("con modelo, la clasificación validada decide quién responde; la voz entra como texto", () => {
    const clasificacion = validarClasificacion({ version: "0", experto: "ia_base", accion: "explicar_dosis", parametros: {}, confianza: 0.8, fuente: "modelo" });
    const r = turno({ via: "voz", transcripcion: "will the rays make us ill", con: "ingeniera" }, s, MEMORIA_INICIAL, { ...o, clasificacion });
    expect(r).toMatchObject({ habla: "doctora", actor: "doctora", entendido: true, origen: "modelo" });
  });
  it("con confianza bajo el umbral el personaje pregunta y no queda como última pregunta", () => {
    const clasificacion = validarClasificacion({ version: "0", experto: "ia_base", accion: "estado_salud", parametros: {}, confianza: 0.4, fuente: "modelo" });
    const r = turno({ via: "texto", texto: "my tummy feels funny" }, s, MEMORIA_INICIAL, { ...o, clasificacion });
    expect(r).toMatchObject({ habla: "doctora", entendido: false });
    expect(r.globo?.clave).toBe("agentes.aclarar.doctora");
    expect(r.memoria.ultima).toBeNull();
  });
  it("los atajos ganan al modelo: lo que se entiende sin red no depende de él", () => {
    const clasificacion = validarClasificacion({ version: "0", experto: "ia_base", accion: "saludo", parametros: {}, confianza: 0.9, fuente: "modelo" });
    expect(turno({ via: "texto", texto: "is a storm coming?" }, s, MEMORIA_INICIAL, { ...o, clasificacion })).toMatchObject({ habla: "meteorologa", origen: "regex" });
  });
  it("tocar una opción es otro turno y responde quien corresponde a la pregunta", () => {
    const [, dosis] = opcionesDe("doctora");
    const r = turno(dosis!.entrada, s, MEMORIA_INICIAL, o);
    expect(r.dialogo.lineas[0]?.clave).toBe("agentes.doctora.dosis.analogia");
    expect(r.origen).toBe("boton");
  });
  it("la memoria cuenta turnos, recuerda con quién se habló y repite la última pregunta", () => {
    const a = turno({ via: "boton", con: "ingeniera" }, s, MEMORIA_INICIAL, o);
    const b = turno({ via: "texto", texto: "otra vez" }, s, a.memoria, o);
    const c = turno({ via: "acercarse", con: "doctora" }, s, b.memoria, o);
    expect(b.dialogo).toEqual(a.dialogo);
    expect(c.memoria).toMatchObject({ turnos: 3, hablados: ["ingeniera", "doctora"], ultima: { con: "ingeniera", pregunta: "estado_energia" } });
    expect(MEMORIA_INICIAL).toEqual({ turnos: 0, hablados: [], ultima: null, comentados: {} });
    expect(JSON.parse(JSON.stringify(c.memoria))).toEqual(c.memoria);
  });
  it("conversar nunca cambia el estado: la acción es solo una propuesta", () => {
    const antes = JSON.stringify(s);
    const r = turno({ via: "texto", texto: "arregla a la ia" }, s, MEMORIA_INICIAL, o);
    expect(r.dialogo.accion).toEqual({ tipo: "reparar", equipo: "ia_base" });
    expect(JSON.stringify(s)).toBe(antes);
  });
  it("es puro: misma entrada, estado y memoria, misma respuesta", () => {
    const e = { via: "texto", texto: "how much energy do we have", con: "ingeniera" } as const;
    expect(turno(e, s, MEMORIA_INICIAL, o)).toEqual(turno(e, s, MEMORIA_INICIAL, o));
  });
});

describe("contrato de conversación: actores, recuerdos y textos", () => {
  it("cada actor de la escena tiene quien responda, y al revés", () => {
    for (const actor of ["ingeniera", "doctora", "meteorologa", "iris"] as const) expect(actorDe(interlocutorDe(actor))).toBe(actor);
    expect(actorDe("matematico")).toBeNull();
  });
  it("dos partidas con decisiones distintas dejan recuerdos distintos, uno por decisión", () => {
    const refugio = aplicarAccion(s, { tipo: "refugiarse" });
    const escudo = aplicarAccion(s, { tipo: "subir_escudo", nivel: 2 });
    expect(recuerdosDe(refugio.causas).at(-1)?.accion).toEqual({ tipo: "refugiarse" });
    expect(recuerdosDe(escudo.causas).at(-1)?.accion).toEqual({ tipo: "subir_escudo", nivel: 2 });
    expect(recuerdosDe(refugio.causas).length).toBe(recuerdosDe(s.causas).length + 1);
  });
  it("la mala suerte, el sistema y las simulaciones no son recuerdos", () => {
    expect(recuerdosDe([
      { tick: 1, origen: "mala_suerte", descripcionKey: "x", accion: { tipo: "esperar" } },
      { tick: 1, origen: "sistema", descripcionKey: "causa.simular", accion: { tipo: "simular", accion: { tipo: "refugiarse" } } },
      { tick: 2, origen: "decision", descripcionKey: "x" },
    ])).toEqual([]);
  });
  it("cada saludo y cada pregunta de botón existe en inglés y en español", () => {
    const preguntas = new Set<ClassifierIntent>(QUIENES.flatMap((q) => PREGUNTAS_DE[q]));
    const claves = [...QUIENES.map((q) => `agentes.conversacion.saludo.${q}`), ...[...preguntas].map((p) => `agentes.conversacion.pregunta.${p}`)];
    for (const clave of claves) {
      expect(en, clave).toHaveProperty([clave]);
      expect(es, clave).toHaveProperty([clave]);
    }
  });
});
