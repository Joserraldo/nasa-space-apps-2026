import { describe, expect, it } from "vitest";
import { ordenarSitios } from "@solar-shield/engine";
import { MISIONES } from "./misiones.js";
import { inicial, reducir, type Juego } from "./reductor.js";

describe("humo multi-misión", () => {
  for (const m of MISIONES) it(m.id, () => {
    let j: Juego = inicial({ misionId: m.id, semilla: "humo-1" });
    expect(j.misionId).toBe(m.id);
    j = reducir(j, { tipo: "fase", fase: "sitio" });
    const c = m.sitiosCandidatos[0]!;
    const [s] = ordenarSitios([{ id: c.id, nombreKey: "x", puntajes: { plano: 0.5, luz: 0.5, blindaje: 0.5 } }], j.estado.objetivo);
    j = reducir(j, { tipo: "sitio", sitio: s! });
    for (const mod of m.modulosDisponibles) if (j.colocados.length < m.modulosAColocar) j = reducir(j, { tipo: "modulo", modulo: mod });
    j = reducir(j, { tipo: "fase", fase: "base" });
    const traza: string[] = [];
    for (let i = 0; i < 40 && j.fase !== "final"; i++) {
      if (j.fase === "tormenta") {
        j = reducir(j, { tipo: "dilema", opcionId: m.dilemaPaso6.opciones[0]!.id });
        j = reducir(j, { tipo: "seguir" });
        j = reducir(j, { tipo: "accion", accion: { tipo: "enviar_telemetria" } });
      }
      j = reducir(j, { tipo: "pausa", pausado: false });
      j = reducir(j, { tipo: "tick" });
      traza.push(`${j.estado.tick}:${j.fase}`);
    }
    console.log(m.id, j.colocados, j.estado.resultado, "dia", j.estado.dia, traza.join(" "));
    expect(j.fase).toBe("final");
  });
});
