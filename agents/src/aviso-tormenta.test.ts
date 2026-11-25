import { describe, expect, it } from "vitest";
import { partidaDorada, tormentaActiva } from "@solar-shield/engine";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { conversar, guiaIrisLugar } from "./index.js";

// P0.4: la Meteoróloga e Iris avisan de la tormenta ANTES de que llegue.
// La partida dorada trae la tormenta en el estado desde el tick 0; `tormentaActiva` la revela en el paso 5.
const s = partidaDorada();
const antes = { tormentaActiva: false };

describe("P0.4: aviso de la tormenta antes de que llegue", () => {
  it("con la tormenta en el estado pero sin activar, la Meteoróloga avisa y avisa de prepararse", () => {
    const d = conversar({ experto: "meteorologa" }, s, antes);
    expect(d.lineas[0]?.clave).toBe("agentes.meteorologa.pronostico.viene");
    expect(d.lineas[1]?.clave).toBe("agentes.meteorologa.pronostico.preparar");
    expect(d.prioridad).toBe("alerta");
    expect(d.fuente?.url).toBeTruthy();
  });

  it("el aviso nombra la tormenta real y su fecha", () => {
    const d = conversar({ experto: "meteorologa" }, s, antes);
    expect(d.lineas[0]?.vars?.nombreKey).toBe(`datos.tormenta.${s.tormenta!.id}.nombre`);
    expect(d.lineas[0]?.vars?.fecha).toBe(s.tormenta!.inicio.slice(0, 10));
  });

  it("con la tormenta activa la Meteoróloga da el parte real, no el aviso", () => {
    expect(tormentaActiva(s)).toBe(false);
    const d = conversar({ experto: "meteorologa" }, s, { tormentaActiva: true });
    expect(d.lineas[0]?.clave).toBe("agentes.meteorologa.pronostico.real");
  });

  it("sin tormenta en el estado sigue diciendo que el Sol está tranquilo", () => {
    const d = conversar({ experto: "meteorologa" }, { ...s, tormenta: null }, antes);
    expect(d.lineas[0]?.clave).toBe("agentes.meteorologa.pronostico.calma");
  });

  it("Iris avisa en el taller del paso 4 cuando la tormenta está en el estado", () => {
    const g = guiaIrisLugar({ ...s, iaBase: "tutorial" }, 4);
    expect(g).toMatchObject({ destino: "taller", experto: "ingeniera" });
    expect(g!.dialogo.lineas[0]?.clave).toBe("agentes.iris.acompana.tutorial.tormenta_viene");
  });

  it("sin tormenta en el estado, el paso 4 sigue siendo el de los módulos", () => {
    const g = guiaIrisLugar({ ...s, iaBase: "tutorial", tormenta: null }, 4);
    expect(g!.dialogo.lineas[0]?.clave).toBe("agentes.iris.acompana.tutorial.modulos_colocados");
  });

  it("las claves nuevas existen en inglés y español, y el tutorial nombra lugar y experta", () => {
    const claves = [
      "agentes.meteorologa.pronostico.viene",
      "agentes.meteorologa.pronostico.preparar",
      "agentes.iris.acompana.tutorial.tormenta_viene",
      "agentes.iris.acompana.pista.tormenta_viene",
    ];
    for (const k of claves) {
      expect(en[k as keyof typeof en], `en ${k}`).toBeDefined();
      expect(es[k as keyof typeof es], `es ${k}`).toBeDefined();
    }
    expect(en["agentes.iris.acompana.tutorial.tormenta_viene"]).toContain("{lugarKey}");
    expect(en["agentes.iris.acompana.tutorial.tormenta_viene"]).toContain("{expertoKey}");
  });
});
