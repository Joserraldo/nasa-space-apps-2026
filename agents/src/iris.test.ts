import { describe, expect, it } from "vitest";
import { ActionSchema } from "@solar-shield/contracts";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { formaFalla, irisDanada, numeroFalso, verificarIris, type FormaFalla, type VistaAgente } from "./index.js";

const vista = (blindaje: number, rngEstado = 7): VistaAgente & { rngEstado: number } => ({
  recursos: { energia: 60, soporte_vital: 70, blindaje },
  tripulacion: [],
  tormenta: null,
  equipos: {},
  rngEstado,
});

describe("forma de la falla (código + semilla, nunca el modelo)", () => {
  it("la primera falla es siempre el número falso (ruta dorada)", () => {
    for (const rng of [0, 1, 7, 123456]) expect(formaFalla(rng, 0)).toBe("numero_falso");
  });
  it("después rota: determinista por semilla y salen las 4 formas", () => {
    expect(formaFalla(7, 3)).toBe(formaFalla(7, 3));
    const vistas = new Set<FormaFalla>([0, 1, 2, 3].map((n) => formaFalla(5, n + 1)));
    expect(vistas.size).toBe(4);
  });
});

describe("número que no coincide con el medidor", () => {
  it("se aleja al menos 40 puntos del valor real y queda en 0-100", () => {
    for (const real of [0, 10, 35, 49, 50, 80, 100]) {
      const dicho = numeroFalso(real);
      expect(Math.abs(dicho - real)).toBeGreaterThanOrEqual(40);
      expect(dicho).toBeGreaterThanOrEqual(0);
      expect(dicho).toBeLessThanOrEqual(100);
    }
  });
  it("Iris dice un escudo alto cuando el real está bajo y aconseja bajarlo", () => {
    const d = irisDanada(vista(30));
    expect(d.falla).toEqual({ forma: "numero_falso", recurso: "blindaje", valorReal: 30, valorDicho: 75 });
    expect(d.lineas.map((l) => l.clave)).toEqual(["agentes.iris.falla.glitch", "agentes.iris.falla.numero", "agentes.iris.falla.numeroConsejo"]);
    expect(d.lineas[1]?.vars).toEqual({ valor: 75 });
  });
  it("la Ingeniera compara lo dicho con el medidor y propone repararla", () => {
    const d = irisDanada(vista(30));
    const v = verificarIris(d.falla, vista(30));
    expect(v.experto).toBe("ingeniera");
    expect(v.lineas[0]).toEqual({ clave: "agentes.iris.verificar.numero", vars: { dicho: 75, real: 30 } });
    expect(v.accion).toEqual({ tipo: "reparar", equipo: "ia_base" });
  });
});

describe("las 4 formas", () => {
  const todas: FormaFalla[] = ["numero_falso", "silencio", "experto_equivocado", "accion_peligrosa"];
  const deForma = (f: FormaFalla) => {
    for (let n = 0; n < 8; n++) if (formaFalla(5, n) === f) return irisDanada(vista(40, 5), n);
    throw new Error(f);
  };
  it("cada una se puede verificar y reparar con la Ingeniera; claves en en y es", () => {
    for (const f of todas) {
      const d = deForma(f);
      expect(d.falla.forma).toBe(f);
      if (d.accion) expect(ActionSchema.safeParse(d.accion).success).toBe(true);
      const v = verificarIris(d.falla, vista(40, 5));
      expect(v.accion).toEqual({ tipo: "reparar", equipo: "ia_base" });
      for (const l of [...d.lineas, ...v.lineas]) {
        expect(en[l.clave as keyof typeof en], l.clave).toBeDefined();
        expect(es[l.clave as keyof typeof es], l.clave).toBeDefined();
      }
    }
  });
  it("la acción peligrosa parece razonable pero quita energía del escudo", () => {
    expect(deForma("accion_peligrosa").accion).toEqual({ tipo: "redistribuir_energia", hacia: "soporte_vital", cantidad: 50 });
  });
});
