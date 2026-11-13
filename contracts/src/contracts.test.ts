import { describe, expect, it } from "vitest";
import {
  ActionSchema,
  ClassifierOutputSchema,
  GameStateSchema,
  SeedSchema,
  SpaceWeatherEventSchema,
} from "./index.js";

describe("contracts", () => {
  it("acepta una semilla simple y rechaza vacía", () => {
    expect(SeedSchema.safeParse("2026-11-14").success).toBe(true);
    expect(SeedSchema.safeParse("").success).toBe(false);
  });

  it("Action es un enum cerrado", () => {
    expect(ActionSchema.safeParse({ tipo: "refugiarse" }).success).toBe(true);
    expect(ActionSchema.safeParse({ tipo: "volar" }).success).toBe(false);
    expect(
      ActionSchema.safeParse({ tipo: "simular", accion: { tipo: "refugiarse" } }).success,
    ).toBe(true);
  });

  it("ClassifierOutput exige confianza 0-1", () => {
    const base = { version: "0", experto: "ingeniera", accion: "reparar", fuente: "regex" };
    expect(ClassifierOutputSchema.safeParse({ ...base, confianza: 1.5 }).success).toBe(false);
    expect(ClassifierOutputSchema.safeParse({ ...base, confianza: 0.9 }).success).toBe(true);
    // Parámetros solo como texto de enum, nunca números libres.
    expect(ClassifierOutputSchema.safeParse({ ...base, confianza: 0.9, parametros: { cantidad: 30 } }).success).toBe(false);
    expect(ClassifierOutputSchema.safeParse({ ...base, confianza: 0.9, accion: "volar" }).success).toBe(false);
  });

  it("SpaceWeatherEvent acepta los opcionales de datos (fases, marcoMarte, medicionMarte)", () => {
    const ev = {
      id: "2024-05-20-marte",
      tipo: "CME",
      inicio: "2024-05-20T05:36:00Z",
      duracionHoras: 72,
      intensidad: 0.9,
      fuente: { nombreKey: "fuente.donki", url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/", idFuente: "2024-05-20T05:36:00-CME-001", consultadoEl: "2026-11-13", dueno: "NASA CCMC", estadoDato: "curado" },
      fases: [{ tipo: "CME", idFuente: "x", offsetHoras: 0, observadoEn: "Sol" }],
      marcoMarte: "observado",
      medicionMarte: { unidad: "µGy/h", fondo: 10, pico: 194, factor: 19.4, offsetHorasPico: 40 },
    };
    expect(SpaceWeatherEventSchema.safeParse(ev).success).toBe(true);
    expect(SpaceWeatherEventSchema.safeParse({ ...ev, marcoMarte: "inventado" }).success).toBe(false);
  });

  it("GameState rechaza recursos fuera de 0-100", () => {
    expect(GameStateSchema.safeParse({ recursos: { energia: 120 } }).success).toBe(false);
  });
});
