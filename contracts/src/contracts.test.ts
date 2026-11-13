import { describe, expect, it } from "vitest";
import {
  ActionSchema,
  ClassifierOutputSchema,
  GameStateSchema,
  SeedSchema,
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
    const malo = { experto: "ingeniera", accion: "reparar", confianza: 1.5 };
    expect(ClassifierOutputSchema.safeParse(malo).success).toBe(false);
    const bueno = { experto: "ingeniera", accion: "reparar", confianza: 0.9 };
    expect(ClassifierOutputSchema.safeParse(bueno).success).toBe(true);
  });

  it("GameState rechaza recursos fuera de 0-100", () => {
    expect(GameStateSchema.safeParse({ recursos: { energia: 120 } }).success).toBe(false);
  });
});
