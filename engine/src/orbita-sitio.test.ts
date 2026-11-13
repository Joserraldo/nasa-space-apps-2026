import { describe, expect, it } from "vitest";
import type { SpaceWeatherEvent } from "@solar-shield/contracts";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { crearPartida } from "./escenario.js";
import { ajustarAltura, alSol, avanzarOrbita, franjaEn, senalDeDano, ticksPorVuelta } from "./orbita.js";
import { ordenarSitios, puntuarSitio } from "./sitio.js";

const fuente = { nombreKey: "fuente.donki", url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/", idFuente: "x", consultadoEl: "2026-11-13" };
const tormentaMedida: SpaceWeatherEvent = {
  id: "2024-05-20-marte", tipo: "CME", inicio: "2024-05-20T05:36:00Z", duracionHoras: 72, intensidad: 0.3, fuente,
  marcoMarte: "observado", medicionMarte: { unidad: "µGy/h", fondo: 10, pico: 194, factor: 19.4, offsetHorasPico: 40 },
};

describe("órbita", () => {
  it("más alto, más ticks por vuelta y franja más ancha", () => {
    expect(ticksPorVuelta(600)).toBeGreaterThan(ticksPorVuelta(300));
    const media = (h: number) => {
      const v = ticksPorVuelta(h);
      return Array.from({ length: v }, (_, t) => franjaEn(t, h)).reduce((a, b) => a + b, 0) / v;
    };
    expect(media(600)).toBeGreaterThan(media(300));
  });
  it("alterna sol y sombra; la batería sube al sol y baja en sombra", () => {
    const o = { alturaKm: 300, franja: 1, bateriaPct: 50, senalPct: 100, escudoPct: 100 };
    const vuelta = ticksPorVuelta(300);
    const soles = Array.from({ length: vuelta }, (_, t) => alSol(t, 300));
    expect(soles).toContain(true);
    expect(soles).toContain(false);
    const tSol = soles.indexOf(true), tSombra = soles.indexOf(false);
    expect(avanzarOrbita(o, tSol, 0, false).bateriaPct).toBeGreaterThan(50);
    expect(avanzarOrbita(o, tSombra, 0, false).bateriaPct).toBeLessThan(50);
  });
  it("la tormenta desgasta el escudo y la antena averiada baja la señal", () => {
    const o = { alturaKm: 400, franja: 1, bateriaPct: 50, senalPct: 100, escudoPct: 100 };
    const centro = Math.floor(ticksPorVuelta(400) / 2);
    expect(avanzarOrbita(o, centro, 1, false).escudoPct).toBeLessThan(100);
    expect(avanzarOrbita(o, centro, 0, true).senalPct).toBeLessThan(avanzarOrbita(o, centro, 0, false).senalPct);
  });
  it("órbita baja pierde altura por arrastre; ajustar respeta límites", () => {
    const o = { alturaKm: 220, franja: 1, bateriaPct: 50, senalPct: 100, escudoPct: 100 };
    expect(avanzarOrbita(o, 0, 0, false).alturaKm).toBeLessThan(220);
    expect(ajustarAltura(o, -500).alturaKm).toBe(200);
    expect(ajustarAltura(o, 5000).alturaKm).toBe(600);
  });
  it("ajustar_orbita cambia la altura en la partida", () => {
    const s0 = crearPartida("orb", { sitio: "marte_jezero" });
    const s1 = aplicarAccion(s0, { tipo: "ajustar_orbita", deltaAlturaKm: 30 });
    expect(s1.orbita!.alturaKm).toBe(s0.orbita!.alturaKm + 30);
  });
});

describe("señal de daño en Marte", () => {
  it("en Marte con medición RAD manda el factor, no la intensidad", () => {
    const base = crearPartida("rad", { sitio: "marte_jezero" });
    const conMedicion = senalDeDano({ ...base, tormenta: tormentaMedida });
    const sinMedicion = senalDeDano({ ...base, tormenta: { ...tormentaMedida, medicionMarte: undefined } as SpaceWeatherEvent });
    expect(conMedicion).toBeGreaterThan(0.9);
    expect(sinMedicion).toBeCloseTo(0.3);
  });
  it("en la Luna se ignora la medición de Marte", () => {
    const base = crearPartida("luna", { sitio: "luna_polo_sur" });
    expect(senalDeDano({ ...base, tormenta: tormentaMedida })).toBeCloseTo(0.3);
  });
  it("la tormenta medida golpea el blindaje al avanzar el tick", () => {
    const s0 = { ...crearPartida("golpe", { sitio: "marte_jezero", dificultad: "facil" }), tormenta: tormentaMedida };
    const s1 = avanzarTick(s0);
    expect(s1.causas.some((c) => c.descripcionKey === "causa.tormenta" && c.origen === "mala_suerte")).toBe(true);
    expect(s1.recursos.blindaje).toBeLessThan(s0.recursos.blindaje - 5);
  });
});

describe("puntaje de sitio (3 criterios)", () => {
  const sitios = [
    { id: "llanura-central", nombreKey: "s.llanura", puntajes: { plano: 0.9, luz: 0.9, blindaje: 0.61 } },
    { id: "pie-de-la-pared-sur", nombreKey: "s.pared", puntajes: { plano: 0.39, luz: 0.53, blindaje: 0.71 } },
    { id: "sobre-el-borde-oeste", nombreKey: "s.borde", puntajes: { plano: 0.14, luz: 0.91, blindaje: 0.37 } },
  ];
  it("el total es la suma ponderada y cae en un rango", () => {
    const p = puntuarSitio(sitios[0]!, "explorar");
    expect(p.total).toBeCloseTo(0.9 * 0.4 + 0.9 * 0.3 + 0.61 * 0.3, 3);
    expect(p.rangoKey).toBe("sitio.rango.excelente");
  });
  it("el objetivo cambia el orden: cultivar premia la luz", () => {
    const explorar = ordenarSitios(sitios, "explorar").map((s) => s.id);
    const cultivar = ordenarSitios(sitios, "cultivar").map((s) => s.id);
    expect(explorar[0]).toBe("llanura-central");
    expect(cultivar.indexOf("sobre-el-borde-oeste")).toBeLessThan(explorar.indexOf("sobre-el-borde-oeste"));
  });
  it("ningún sitio es perfecto en los 3 criterios (trade-off real)", () => {
    for (const s of sitios) expect(Object.values(s.puntajes).every((v) => v >= 0.8)).toBe(false);
  });
});
