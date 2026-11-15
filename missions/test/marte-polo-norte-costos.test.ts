/**
 * Misión Marte polo norte: ninguna opción del dilema de la batería es gratis.
 * Vive en missions/test/ (fuera de src/) porque lee los costos de design/ (COSTOS_ACCION),
 * del que missions no depende en su código.
 */
import { describe, expect, it } from "vitest";
import { COSTOS_ACCION } from "@solar-shield/design";
import { MISION_MARTE_POLO_NORTE } from "@solar-shield/missions";

describe("misión Marte polo norte: el dilema cuesta", () => {
  it("cada opción baja algún medidor ya y mueve al menos dos", () => {
    for (const o of MISION_MARTE_POLO_NORTE.dilemaPaso6.opciones) {
      const costo = COSTOS_ACCION[o.accion.tipo as keyof typeof COSTOS_ACCION];
      expect(costo, o.id).toBeDefined();
      expect(Object.values(costo.inmediato).some((v) => (v ?? 0) < 0), o.id).toBe(true);
      const movidos = new Set([...Object.keys(costo.inmediato), ...Object.keys(costo.retrasado)]);
      expect(movidos.size, o.id).toBeGreaterThanOrEqual(2);
    }
  });
});
