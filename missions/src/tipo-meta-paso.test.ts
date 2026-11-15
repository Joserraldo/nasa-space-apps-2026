import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type PasoMision } from "./jezero.js";

describe("PasoMision: meta ampliable", () => {
  it("acepta una meta propia de otra misión", () => {
    const p: PasoMision = { n: 2, tituloKey: "mision.prueba.paso2", meta: "ruta_elegida_con_decision" };
    expect(p.meta).toBe("ruta_elegida_con_decision");
  });
  it("Jezero conserva sus 8 metas", () => {
    expect(MISION_JEZERO.pasos.map((p) => p.meta)).toEqual([
      "satelite_suelto", "ruta_dibujada", "sitio_elegido", "modulos_colocados",
      "tormenta_llega", "consejo_opuesto", "telemetria_enviada", "fin",
    ]);
  });
});
