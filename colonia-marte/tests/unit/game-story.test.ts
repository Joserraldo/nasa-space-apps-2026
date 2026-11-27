import { describe, expect, it } from "vitest";
import c1 from "../../data/story/c1.json";
import { estadoDialogo } from "../../src/game/adaptador";
import { CAPITULOS, validarCapitulo } from "../../src/game/historia";
import { existe, traducir } from "../../src/game/i18n";
import { parseHudReplyParams } from "../../src/ui/organisms/crew-dialogue";

const IDIOMAS = ["en", "es"] as const;
const palabras = (t: string) => t.trim().split(/\s+/).length;

describe("guion de C1 y C2", () => {
  it("cada línea y respuesta existe en los dos idiomas, con 12 palabras como máximo", () => {
    for (const { escenas } of CAPITULOS)
      for (const e of escenas)
        for (const clave of [e.linea, ...e.respuestas.map((r) => r.texto)])
          for (const idioma of IDIOMAS) {
            expect(existe(clave, idioma), `${idioma} ${clave}`).toBe(true);
            expect(palabras(traducir(idioma, clave)), `${idioma} ${clave}`).toBeLessThanOrEqual(12);
          }
  });

  it("la vista acepta cada respuesta y su ícono", () => {
    for (const { escenas } of CAPITULOS)
      for (const e of escenas)
        for (const r of estadoDialogo(e, "es").replies) expect(() => parseHudReplyParams(r), `${e.id} ${r.id}`).not.toThrow();
  });

  it("los pasos avanzan en orden y cada capítulo termina esperando a la Tierra", () => {
    for (const { escenas } of CAPITULOS) {
      const pasos = escenas.map((e) => e.paso);
      expect(pasos).toEqual([...pasos].sort((a, b) => a - b));
      expect(escenas.at(-1)!.respuestas.map((r) => r.hace.tipo)).toEqual(["esperar-final"]);
    }
  });

  it("C1 no repite «refugio o escudo»: solo pregunta el plan si la intro no lo preguntó", () => {
    const conPlan = CAPITULOS[0]!.escenas.filter((e) => e.respuestas.some((r) => r.hace.tipo === "elegir-plan"));
    expect(conPlan.map((e) => e.si)).toEqual(["sin-plan"]);
  });

  it("la tormenta real se anuncia con su fuente", () => {
    for (const { escenas } of CAPITULOS) {
      const aviso = escenas.find((e) => e.antes === "tormenta")!;
      expect(existe(aviso.fuente!, "en")).toBe(true);
    }
  });

  it("una escena mal escrita se rechaza", () => {
    const mala = structuredClone(c1) as { capitulo: number; mision: string; escenas: { respuestas: { hace: unknown }[] }[] };
    mala.escenas[0]!.respuestas[0]!.hace = { tipo: "dilema", opcion: "no-existe" };
    expect(() => validarCapitulo(mala)).toThrow(/opción desconocida/);
  });
});
