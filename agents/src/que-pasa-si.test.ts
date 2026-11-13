import { describe, expect, it } from "vitest";
import { aplicarAccion, partidaDorada } from "@solar-shield/engine";
import { queSiMatematico } from "./index.js";

describe("Matemático ¿Y si…?", () => {
  it("lee la diferencia que calcula el motor y deja la decisión al jugador", () => {
    const s = partidaDorada();
    const accion = { tipo: "redistribuir_energia", hacia: "blindaje", cantidad: 25 } as const;
    const despues = aplicarAccion(s, accion);
    const d = queSiMatematico(accion, s.recursos, despues.recursos);
    expect(d.experto).toBe("matematico");
    expect(d.accion).toEqual(accion);
    const baja = d.lineas.find((x) => x.clave === "agentes.matematico.baja" && x.vars?.["recursoKey"] === "agentes.recurso.energia");
    expect(baja?.vars).toMatchObject({ desde: Math.round(s.recursos.energia), hasta: Math.round(despues.recursos.energia) });
    expect(d.lineas.at(-1)?.clave).toBe("agentes.matematico.decides");
  });
  it("si nada cambia lo dice, sin inventar cifras", () => {
    const r = partidaDorada().recursos;
    const d = queSiMatematico({ tipo: "refugiarse" }, r, r);
    expect(d.lineas.map((x) => x.clave)).toEqual(["agentes.matematico.calculo", "agentes.matematico.igual", "agentes.matematico.decides"]);
  });
});
