import { describe, expect, it } from "vitest";
import { ClassifierOutputSchema } from "@solar-shield/contracts";
import { aAccion, clasificarConAtajos, normalizar } from "./index.js";

// Las 30 frases de docs/ideas/agentes.md §5. null = la capa sin modelo no la entiende (pasa al modelo o a botones).
const CASOS: [string, string | null, string | null, Record<string, string>][] = [
  ["sube el escudo ya!!!", "ingeniera", "repartir_energia", { destino: "blindaje", cantidad: "mucho" }],
  ["ponle un poquito mas de energia al aire", "ingeniera", "repartir_energia", { destino: "soporte_vital", cantidad: "poco" }],
  ["se daño el panel arreglalo", "ingeniera", "reparar", { equipo: "panel_solar" }],
  ["cuanta bateria queda", "ingeniera", "estado_energia", {}],
  ["la compu de la base esta rara, la puedes componer?", "ingeniera", "reparar", { equipo: "ia_base" }],
  ["doctora estamos bien?", "doctora", "estado_salud", {}],
  ["todos al refugio rapido", "doctora", "ir_al_refugio", {}],
  ["que es eso de la dosis", "doctora", "explicar_dosis", {}],
  ["me duele la cabeza al astronauta", "doctora", "estado_salud", {}],
  ["viene una tormenta?", "meteorologa", "pronostico", {}],
  ["q fue esa luz del sol", "meteorologa", "explicar_evento", {}],
  ["cuando llega la llamarada", "meteorologa", "pronostico", {}],
  ["que pasa si apago el laboratorio", "matematico", "que_pasa_si", {}],
  ["y si nos escondemos todos", "matematico", "que_pasa_si", { accion: "ir_al_refugio" }],
  ["ayudaaa no se que hacer", "ia_base", "ayuda", {}],
  ["hola", "ia_base", "saludo", {}],
  ["otra vez porfa", "ia_base", "repetir", {}],
  ["cuentame un chiste de popo", null, null, {}],
  ["quien gano el partido", null, null, {}],
  ["raise the shield", "ingeniera", "repartir_energia", { destino: "blindaje", cantidad: "medio" }],
  ["is a storm coming", "meteorologa", "pronostico", {}],
  ["everyone hide now", "doctora", "ir_al_refugio", {}],
  ["fix the antenna please", "ingeniera", "reparar", { equipo: "antena" }],
  ["what if we turn off the lab", "matematico", "que_pasa_si", {}],
  ["mas oxigeno pero no tanto", "ingeniera", "repartir_energia", { destino: "soporte_vital", cantidad: "poco" }],
  ["la doctora dice que nos escondamos, hazlo", "doctora", "ir_al_refugio", {}],
  ["pon todo en el escudo y nada en el lab", "ingeniera", "repartir_energia", { destino: "blindaje", cantidad: "mucho" }],
  ["el sol esta enojado?", "meteorologa", "pronostico", {}],
  ["hay radiacion mala aqui?", "doctora", "explicar_dosis", {}],
  ["arregla a la ia que esta loca", "ingeniera", "reparar", { equipo: "ia_base" }],
];

describe("normalizar", () => {
  it("quita tildes, signos, letras repetidas y expande jerga", () => {
    expect(normalizar("¡¡AYUDAAA!! q hago xq")).toBe("ayuda que hago porque");
  });
});

describe("clasificarConAtajos: 30 frases de niños", () => {
  it.each(CASOS)("%s", (frase, experto, accion, parametros) => {
    const r = clasificarConAtajos(frase);
    if (accion === null) return expect(r).toBeNull();
    expect(r).not.toBeNull();
    expect(ClassifierOutputSchema.parse(r)).toEqual(r);
    expect(r).toMatchObject({ experto, accion, parametros, fuente: "regex" });
  });

  it("si nombra a un experto pero no se entiende, ese experto pregunta con confianza baja", () => {
    expect(clasificarConAtajos("ingeniera blablabla")).toMatchObject({ experto: "ingeniera", confianza: 0.5 });
  });
});

describe("aAccion", () => {
  const de = (f: string) => aAccion(clasificarConAtajos(f)!);
  it("mapea órdenes a acciones válidas del motor", () => {
    expect(de("sube el escudo ya!!!")).toEqual({ tipo: "redistribuir_energia", hacia: "blindaje", cantidad: 45 });
    expect(de("fix the antenna please")).toEqual({ tipo: "reparar", equipo: "antena" });
    expect(de("everyone hide now")).toEqual({ tipo: "refugiarse" });
    expect(de("y si nos escondemos todos")).toEqual({ tipo: "simular", accion: { tipo: "refugiarse" } });
  });
  it("las consultas no mueven el juego", () => {
    expect(de("viene una tormenta?")).toBeNull();
    expect(de("que pasa si apago el laboratorio")).toBeNull();
  });
});
