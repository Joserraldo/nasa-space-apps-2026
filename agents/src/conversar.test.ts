import { describe, expect, it } from "vitest";
import { partidaDorada, tormentaActiva } from "@solar-shield/engine";
import { conversar, preguntaDelBoton } from "./index.js";

const s = partidaDorada();
const o = { tormentaActiva: tormentaActiva(s) };

describe("conversar: una entrada para el panel de ui", () => {
  it("el botón de un experto arma la pregunta por defecto", () => {
    expect(preguntaDelBoton("meteorologa")).toMatchObject({ accion: "pronostico", fuente: "boton", confianza: 1 });
    expect(conversar({ experto: "ingeniera" }, s, o).lineas[0]?.clave).toMatch(/^agentes\.ingeniera\.energia\./);
  });
  // P0.4: decisión de producto aprobada: la tormenta se anuncia antes de llegar.
  it("antes del paso 5 la Meteoróloga avisa de la tormenta que viene", () => {
    expect(s.tormenta).not.toBeNull();
    expect(conversar({ experto: "meteorologa" }, s, o).lineas[0]?.clave).toBe("agentes.meteorologa.pronostico.viene");
    expect(conversar({ experto: "meteorologa" }, s, { tormentaActiva: true }).lineas[0]?.clave).toBe("agentes.meteorologa.pronostico.real");
  });
  it("texto que no se entiende → aclaración, nunca silencio", () => {
    expect(conversar({ texto: "cuentame un chiste" }, s, o).lineas[0]?.clave).toBe("agentes.aclarar.ia_base");
  });
  it("en la partida dorada Iris está dañada: pedirle ayuda devuelve su falla", () => {
    expect(s.iaBase).toBe("danada");
    const d = conversar({ texto: "ayuda" }, s, o) as { falla?: { forma: string } };
    expect(d.falla?.forma).toBe("numero_falso");
  });
  it("la Ingeniera sí repara a Iris dañada (no dice que está sana)", () => {
    const d = conversar({ texto: "arregla a la ia" }, s, o);
    expect(d.lineas[0]?.clave).toBe("agentes.ingeniera.reparar.ok");
    expect(d.accion).toEqual({ tipo: "reparar", equipo: "ia_base" });
  });
  it("#401: antes de revelar la avería, Iris contesta como en el tutorial y nadie la da por rota", () => {
    const antes = { ...o, averiaRevelada: false };
    const d = conversar({ texto: "ayuda" }, s, antes) as { falla?: unknown; lineas: { clave: string }[] };
    expect(d.falla).toBeUndefined();
    expect(JSON.stringify(d.lineas)).not.toMatch(/danada|averi|falla/);
    // La Ingeniera tampoco la reporta averiada al hablar de energía.
    expect(JSON.stringify(conversar({ experto: "ingeniera" }, s, antes).lineas)).not.toMatch(/ia_base.*averiado/);
    // La verdad sigue en el motor: el estado no cambia.
    expect(s.iaBase).toBe("danada");
  });
  it("#401: revelada (o sin decirlo, como antes), pedirle ayuda devuelve su falla", () => {
    const d = conversar({ texto: "ayuda" }, s, { ...o, averiaRevelada: true }) as { falla?: { forma: string } };
    expect(d.falla?.forma).toBe("numero_falso");
  });
});
